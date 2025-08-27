;; ---- Global State ----
(define-data-var next-event-id uint u1)
(define-data-var next-ticket-id uint u1)
(define-data-var admin principal tx-sender)


;; ---- Maps ----
;; Maps to store events and tickets
(define-map events {event-id: uint} {
    creator: principal,
    name: (string-utf8 100),
    location: (string-utf8 100),
    timestamp: uint,
    price: uint,
    total-tickets: uint,
    tickets-sold: uint,
    created-timestamp: uint
})

;; ticket mapping (by event-id and owner)
(define-map tickets {event-id: uint, owner: principal} {used: bool, ticket-id: uint})

;;  Reverse mapping from ticket-id to owner address for easy lookup
(define-map ticket-owners {ticket-id: uint} {
    owner: principal,
    event-id: uint,
    used: bool,
    purchase-timestamp: uint
})

(define-map organizers {organizer: principal} {is-approved: bool})
(define-map event-cancelled {event-id: uint} bool)




;; ---- Admin Function ----
(define-public (add-organizer (who principal))
  (if (is-eq tx-sender (var-get admin))
      (begin
        (map-set organizers {organizer: who} {is-approved: true})
        (ok true))
      (err u401)))
;; ---- Event Creation ----
(define-public (create-event
    (name (string-utf8 100))
    (location (string-utf8 100))
    (timestamp uint)
    (price uint)
    (total-tickets uint)
  )
  (if (is-some (map-get? organizers {organizer: tx-sender}))
      (let ((event-id (var-get next-event-id)))
        (map-set events
          (tuple (event-id event-id))
          (tuple
            (creator tx-sender)
            (name name)
            (location location)
            (timestamp timestamp)
            (price price)
            (total-tickets total-tickets)
            (tickets-sold u0)
            (created-timestamp stacks-block-height)))
        (var-set next-event-id (+ event-id u1))
        (ok event-id))
      (err u402))
)


;; ---- Ticket Purchase returns ticket ID ----
(define-public (buy-ticket (event-id uint))
  (match (map-get? events (tuple (event-id event-id)))
    event-data
    (let (
          (price (get price event-data))
          (sold (get tickets-sold event-data))
          (total (get total-tickets event-data))
          (new-ticket-id (var-get next-ticket-id))
         )
      (if (>= sold total)
          (err u100) ;; Sold out
          (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
            existing-ticket 
            (err u101) ;; Already owns ticket
            (if (is-eq (stx-transfer? price tx-sender (get creator event-data)) (ok true))
                (begin
                  ;; Store ticket with original mapping
                  (map-set tickets (tuple (event-id event-id) (owner tx-sender))
                    (tuple (used false) (ticket-id new-ticket-id)))
                  ;;Store reverse mapping for easy lookup
                  (map-set ticket-owners (tuple (ticket-id new-ticket-id))
                    (tuple 
                      (owner tx-sender)
                      (event-id event-id)
                      (used false)
                      (purchase-timestamp stacks-block-height)))
                  (var-set next-ticket-id (+ new-ticket-id u1))
                  (map-set events (tuple (event-id event-id))
                    (merge event-data (tuple (tickets-sold (+ sold u1)))))
                  ;;  Return the ticket ID instead of just true
                  (ok new-ticket-id))
                (err u102))
          )
      ))
    (err u103) ;; Event not found
  )
)


;; ----  Ticket Transfer ----
(define-public (transfer-ticket (event-id uint) (to principal))
  (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
    ticket-data
    (let ((ticket-id (get ticket-id ticket-data)))
      (asserts! (not (get used ticket-data)) (err u201))
      ;; Update original mapping
      (map-delete tickets (tuple (event-id event-id) (owner tx-sender)))
      (map-set tickets (tuple (event-id event-id) (owner to))
        (tuple (used false) (ticket-id ticket-id)))
      ;; Update reverse mapping
      (match (map-get? ticket-owners {ticket-id: ticket-id})
        ticket-owner-data
        (begin
          (map-set ticket-owners (tuple (ticket-id ticket-id))
            (merge ticket-owner-data (tuple (owner to))))
          (ok true))
        (err u203)))
    (err u202))
)

;; ----  Check-In by Ticket ID ----
(define-public (check-in-by-ticket-id (ticket-id uint))
  (match (map-get? ticket-owners (tuple (ticket-id ticket-id)))
    ticket-info
    (let (
          (ticket-owner (get owner ticket-info))
          (event-id (get event-id ticket-info))
          (already-used (get used ticket-info))
         )
      (match (map-get? events (tuple (event-id event-id)))
        event-data
        (if (is-eq tx-sender (get creator event-data))
            (if already-used
                (err u301) ;; Ticket already used
                (begin
                  ;; Update both mappings
                  (map-set tickets (tuple (event-id event-id) (owner ticket-owner))
                    (tuple (used true) (ticket-id ticket-id)))
                  (map-set ticket-owners (tuple (ticket-id ticket-id))
                    (merge ticket-info (tuple (used true))))
                  ;; Return success with ticket owner info
                  (ok {
                    ticket-owner: ticket-owner,
                    event-id: event-id,
                    ticket-id: ticket-id})))
            (err u303) ;; Not event creator
        )
        (err u304) ;; Event not found
      )
    )
    (err u305) ;; Ticket ID not found
  )
)

;; ----  Check-In by Address  ----
(define-public (check-in-ticket (event-id uint) (user principal))
  (match (map-get? events (tuple (event-id event-id)))
    event-data
    (if (is-eq tx-sender (get creator event-data))
        (match (map-get? tickets (tuple (event-id event-id) (owner user)))
          ticket-data
          (if (get used ticket-data)
              (err u301) ;; Already used
              (let ((ticket-id (get ticket-id ticket-data)))
                ;; Update both mappings
                (map-set tickets (tuple (event-id event-id) (owner user))
                  (tuple (used true) (ticket-id ticket-id)))
                (match (map-get? ticket-owners {ticket-id: ticket-id})
                  ticket-owner-data
                  (begin
                    (map-set ticket-owners (tuple (ticket-id ticket-id))
                      (merge ticket-owner-data (tuple (used true))))
                    (ok true))
                  (err u306)))
          )
          (err u302) ;; No ticket found
        )
        (err u303) ;; Not event creator
    )
    (err u304) ;; Event not found
  )
)
;; ---- Cancel Event ----
;; Allows the event creator to cancel the event
(define-public (cancel-event (event-id uint))
  (match (map-get? events (tuple (event-id event-id)))
    event-data
    (begin
      (asserts! (is-eq tx-sender (get creator event-data)) (err u501))
      (map-set event-cancelled (tuple (event-id event-id)) true)
      (ok true))
    (err u502))
)

;; --- Refund Ticket ----
(define-public (refund-ticket (event-id uint))
  (let ((cancelled-status (default-to false (map-get? event-cancelled (tuple (event-id event-id))))))
    (asserts! cancelled-status (err u506))
    (match (map-get? events (tuple (event-id event-id)))
      event-data
      (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
        ticket-data
        (let ((ticket-id (get ticket-id ticket-data)))
          (try! (stx-transfer? (get price event-data) (get creator event-data) tx-sender))
          (map-delete tickets (tuple (event-id event-id) (owner tx-sender)))
          (map-delete ticket-owners (tuple (ticket-id ticket-id)))
          (ok true))
        (err u504))
      (err u505)))
)

;; ---- Read-only Functions ----

;; Get event details by ID
(define-read-only (get-event (event-id uint))
  (map-get? events {event-id: event-id})
)

;; Check if an address is an approved organizer
(define-read-only (is-organizer (who principal))
  (default-to false (get is-approved (map-get? organizers {organizer: who})))
)

;; Get admin address
(define-read-only (get-admin)
  (var-get admin)
)

;; Get next event ID
(define-read-only (get-next-event-id)
  (var-get next-event-id)
)

;; Get next ticket ID
(define-read-only (get-next-ticket-id)
  (var-get next-ticket-id)
)

;; Get ticket info for a user and event
(define-read-only (get-ticket (event-id uint) (owner principal))
  (map-get? tickets {event-id: event-id, owner: owner})
)

;; ---- Read-only Functions for Ticket ID Lookup ----

;; Get ticket owner by ticket ID
(define-read-only (get-ticket-owner (ticket-id uint))
  (map-get? ticket-owners {ticket-id: ticket-id})
)

;; Get ticket info by ticket ID (includes event details)
(define-read-only (get-ticket-info (ticket-id uint))
  (match (map-get? ticket-owners (tuple (ticket-id ticket-id)))
    ticket-info
    (let (
          (event-id (get event-id ticket-info))
         )
      (match (map-get? events (tuple (event-id event-id)))
        event-data
        (some {
          ticket-id: ticket-id,
          owner: (get owner ticket-info),
          event-id: event-id,
          event-name: (get name event-data),
          event-location: (get location event-data),
          event-timestamp: (get timestamp event-data),
          used: (get used ticket-info),
          purchase-timestamp: (get purchase-timestamp ticket-info)
        })
        none
      )
    )
    none
  )
)

;; Check if a ticket ID is valid and not used
(define-read-only (is-ticket-valid (ticket-id uint))
  (match (map-get? ticket-owners (tuple (ticket-id ticket-id)))
    ticket-info
    (not (get used ticket-info))
    false))

;; Check if event is cancelled
(define-read-only (is-event-cancelled (event-id uint))
  (default-to false (map-get? event-cancelled {event-id: event-id}))
)

;; Get total events count
(define-read-only (get-total-events)
  (- (var-get next-event-id) u1)
)

;; Get organizer approval status
(define-read-only (get-organizer-status (organizer principal))
  (map-get? organizers {organizer: organizer})
)

;; Get events count for a specific organizer
(define-read-only (get-organizer-events-count (organizer principal))
  (let (
    (total-events (- (var-get next-event-id) u1))
  )
    (if (is-eq total-events u0)
      u0
      (get count (fold count-organizer-events 
        (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31 u32 u33 u34 u35 u36 u37 u38 u39 u40 u41 u42 u43 u44 u45 u46 u47 u48 u49 u50) 
        {organizer: organizer, count: u0, total: total-events}
      ))
    )
  )
)

;; Helper function to count events by organizer
(define-private (count-organizer-events (event-id uint) (acc {organizer: principal, count: uint, total: uint}))
  (if (> event-id (get total acc))
    acc ;; Stop if event-id exceeds total events
    (match (map-get? events {event-id: event-id})
      event-data
      (if (is-eq (get creator event-data) (get organizer acc))
        {organizer: (get organizer acc), count: (+ (get count acc) u1), total: (get total acc)}
        acc
      )
      acc ;; No event found at this ID
    )
  )
)

;; ---- Helper Functions ----

;; Get all events created by a specific organizer (returns list of event IDs)
(define-read-only (get-organizer-events (organizer principal))
  (let (
    (total-events (- (var-get next-event-id) u1))
  )
    (if (is-eq total-events u0)
      (list)
      (get events (fold collect-organizer-events 
        (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31 u32 u33 u34 u35 u36 u37 u38 u39 u40 u41 u42 u43 u44 u45 u46 u47 u48 u49 u50) 
        {organizer: organizer, events: (list), total: total-events}
      ))
    )
  )
)

;; Helper function to collect events by organizer
(define-private (collect-organizer-events (event-id uint) (acc {organizer: principal, events: (list 50 uint), total: uint}))
  (if (> event-id (get total acc))
    acc ;; Stop if event-id exceeds total events
    (match (map-get? events {event-id: event-id})
      event-data
      (if (is-eq (get creator event-data) (get organizer acc))
        {
          organizer: (get organizer acc), 
          events: (unwrap! (as-max-len? (append (get events acc) event-id) u50) acc),
          total: (get total acc)
        }
        acc
      )
      acc ;; No event found at this ID
    )
  )
)
