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

(define-data-var next-event-id uint u1)


(define-public (create-event 
    (name (string-utf8 100))
    (location (string-utf8 100))
    (timestamp uint)
    (price uint)
    (total-tickets uint)
  )
  (let
    ((event-id (var-get next-event-id)))
    (map-set events
      {event-id: event-id}
      {
        creator: tx-sender,
        name: name,
        location: location,
        timestamp: timestamp,
        price: price,
        total-tickets: total-tickets,
        tickets-sold: u0
      }
    )
    ;; Increment the event ID for the next one
    (var-set next-event-id (+ event-id u1))
    ;; Return success
    (ok event-id)
  )
)


  ;; Transfers STX and mints a ticket
(define-public (buy-ticket (event-id uint))
  (let (
        (event (map-get? events (tuple (event-id event-id))))
       )
    (match event event-data
      (let (
            (price (get price event-data))
            (sold (get tickets-sold event-data))
            (total (get total-tickets event-data))
           )
        (begin
          ;; Check if sold out
          (if (>= sold total)
              (err u100) ;; event sold out
              (begin
                ;; Check if sender already owns a ticket
                (match (map-get? tickets (tuple (event-id event-id) (owner tx-sender)))
                  existing-ticket (err u101) ;; already owns a ticket
                  (if (is-eq (stx-transfer? price tx-sender (get creator event-data)) (ok true))
                      (begin
                        ;; Save ticket
                        (map-set tickets (tuple (event-id event-id) (owner tx-sender)) (tuple (used false) (ticket-id u1)))
                        ;; Update ticket count
                        (map-set events (tuple (event-id event-id))
                          {
                            creator: (get creator event-data),
                            name: (get name event-data),
                            location: (get location event-data),
                            timestamp: (get timestamp event-data),
                            price: (get price event-data),
                            total-tickets: (get total-tickets event-data),
                            tickets-sold: (+ sold u1)
                          }
                        )
                        (ok true)
                      )
                      (err u102) ;; failed transfer
                  )
                )
              )
          )
        )
      )
      (err u103) ;; event does not exist
    )
  )
)


;; (define-public (transfer-ticket (event-id uint) (to principal))
;;   ;; Transfers ownership
;; )

;; (define-public (check-in (event-id uint) (ticket-owner principal))
;;   ;; Only organizer can mark ticket as used
;; )
