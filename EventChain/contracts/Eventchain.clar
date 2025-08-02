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
    tickets-sold: uint
})
(define-map tickets {event-id: uint, owner: principal} {used: bool, ticket-id: uint})
(define-map organizers {organizer: principal} {is-approved: bool})
(define-map event-cancelled {event-id: uint} bool)




;; ---- Admin Function ----
(define-public (add-organizer (who principal))
  (if (is-eq tx-sender (var-get admin))
      (begin
        (map-set organizers {organizer: who} {is-approved: true})
        (ok true)
      )
      (err u401)
  )
)
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
        (begin
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
            )
          )
          (var-set next-event-id (+ event-id u1))
          (ok event-id)
        )
      )
      (err u402)
  )
)


;; ---- Ticket Purchase ----
(define-public (buy-ticket (event-id uint))
  (match (map-get? events (tuple (event-id event-id)))
    event-data
    (let (
          (price (get price event-data))
          (sold (get tickets-sold event-data))
          (total (get total-tickets event-data))
         )
      (if (>= sold total)
          (err u100)
          (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
            existing-ticket 
            (err u101)
            (if (is-eq (stx-transfer? price tx-sender (get creator event-data)) (ok true))
                (begin
                    (map-set tickets (tuple (event-id event-id) (owner tx-sender))
                      (tuple (used false) (ticket-id (var-get next-ticket-id)))
                    )
                    (var-set next-ticket-id (+ (var-get next-ticket-id) u1))
                    (map-set events (tuple (event-id event-id))
                      (merge event-data (tuple (tickets-sold (+ sold u1))))
                    )
                    (ok true)
                )
                (err u102)
            )
          )
      ))
    (err u103))
)


;; ---- Ticket Transfer ----
(define-public (transfer-ticket (event-id uint) (to principal))
  (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
    ticket-data
    (if (get used ticket-data)
        (err u201)
        (begin
          (map-delete tickets (tuple (event-id event-id) (owner tx-sender)))
          (map-set tickets (tuple (event-id event-id) (owner to))
            (tuple (used false) (ticket-id (get ticket-id ticket-data)))
          )
          (ok true)
        )
    )
    (err u202)
  )
)

;; ---- Check-In ----
(define-public (check-in-ticket (event-id uint) (user principal))
  (match (map-get? events (tuple (event-id event-id)))
    event-data
    (if (is-eq tx-sender (get creator event-data))
        (match (map-get? tickets (tuple (event-id event-id) (owner user)))
          ticket-data
          (if (get used ticket-data)
              (err u301)
              (begin
                (map-set tickets (tuple (event-id event-id) (owner user))
                  (tuple (used true) (ticket-id (get ticket-id ticket-data)))
                )
                (ok true)
              )
          )
          (err u302)
        )
        (err u303)
    )
    (err u304)
  )
)
;; ---- Cancel Event ----
;; Allows the event creator to cancel the event
(define-public (cancel-event (event-id uint))
  (match (map-get? events (tuple (event-id event-id)))
    event-data
    (if (is-eq tx-sender (get creator event-data))
        (begin
          (map-set event-cancelled (tuple (event-id event-id)) true)
          (ok true)
        )
        (err u501) ;; Not creator
    )
    (err u502) ;; Event not found
  )
)

;; ---- Refund Ticket ----  
(define-public (refund-ticket (event-id uint))
  (match (map-get? event-cancelled (tuple (event-id event-id)))
    cancelled-status
    (if cancelled-status
        (match (map-get? events (tuple (event-id event-id)))
          event-data
          (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
            ticket-data
            (begin
              ;; refund to tx-sender
              (if (is-eq (stx-transfer? (get price event-data) (get creator event-data) tx-sender) (ok true))
                  (begin
                    (map-delete tickets (tuple (event-id event-id) (owner tx-sender)))
                    (ok true)
                  )
                  (err u503) ;; STX transfer failed
              )
            )
            (err u504) ;; No ticket
          )
          (err u505) ;; Event not found
        )
        (err u506) ;; Not cancelled
    )
    (err u506) ;; Not cancelled (event not in cancelled map)
  )
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

;; Get ticket info for a user and event
(define-read-only (get-ticket (event-id uint) (owner principal))
  (map-get? tickets {event-id: event-id, owner: owner})
)

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
(define-private (collect-organizer-events 
  (event-id uint) 
  (acc {organizer: principal, events: (list 50 uint), total: uint})
)
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
