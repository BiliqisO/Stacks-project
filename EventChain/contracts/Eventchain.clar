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
