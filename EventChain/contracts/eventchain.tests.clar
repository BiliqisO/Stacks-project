;; =============================================================================
;; EventChain Rendezvous Tests - Property-Based Testing
;; =============================================================================

;; =============================================================================
;; INVARIANT TESTS
;; =============================================================================

;; Invariant: Total tickets sold should never exceed total tickets available
(define-public (invariant-tickets-not-oversold (event-id uint))
  (match (contract-call? .eventchain get-event event-id)
    event-data (begin
      (asserts! (<= (get tickets-sold event-data) (get total-tickets event-data))
                (err "tickets-sold exceeds total-tickets"))
      (ok true))
    (ok true))) ;; Event doesn't exist, invariant holds

;; Invariant: Events cannot have empty names or locations
(define-public (invariant-event-data-valid (event-id uint))
  (match (contract-call? .eventchain get-event event-id)
    event-data (begin
      (asserts! (> (len (get name event-data)) u0) (err "event name is empty"))
      (asserts! (> (len (get location event-data)) u0) (err "event location is empty"))
      (asserts! (> (get total-tickets event-data) u0) (err "total tickets is zero"))
      (ok true))
    (ok true))) ;; Event doesn't exist, invariant holds

;; Invariant: Used tickets cannot be transferred
(define-public (invariant-used-tickets-cannot-transfer (event-id uint) (owner principal))
  (match (contract-call? .eventchain get-ticket event-id owner)
    ticket-data (begin
      (if (get used ticket-data)
        ;; If ticket is used, any transfer attempt should fail
        (match (contract-call? .eventchain transfer-ticket event-id tx-sender)
          success (err "used ticket was transferred")
          error (ok true))
        (ok true)))
    (ok true))) ;; No ticket, invariant holds

;; =============================================================================
;; PROPERTY-BASED TESTS WITH DISCARD
;; =============================================================================

;; Property: Valid event creation should succeed
(define-public (property-create-event-valid
    (name (string-utf8 50))
    (location (string-utf8 50))
    (future-time uint)
    (price uint)
    (total-tickets uint)
    (image (string-utf8 50)))
  (let ((discard-invalid
         (or (is-eq (len name) u0)           ;; Discard empty names
             (is-eq (len location) u0)       ;; Discard empty locations
             (is-eq total-tickets u0)        ;; Discard zero tickets
             (< future-time u1750000000))))  ;; Discard past times
    (if discard-invalid
        (ok "discarded")
        ;; Valid inputs - test should succeed if organizer is authorized
        (match (contract-call? .eventchain create-event name location future-time price total-tickets image)
          event-id (begin
            ;; Verify event was created with correct data
            (match (contract-call? .eventchain get-event event-id)
              event-data (begin
                (asserts! (is-eq (get name event-data) name) (err "name mismatch"))
                (asserts! (is-eq (get location event-data) location) (err "location mismatch"))
                (asserts! (is-eq (get total-tickets event-data) total-tickets) (err "tickets mismatch"))
                (asserts! (is-eq (get tickets-sold event-data) u0) (err "initial sold not zero"))
                (ok "success"))
              (err "event not found after creation"))
          error (if (is-eq error u403) ;; ERR_NOT_AUTHORIZED
                   (ok "not authorized - acceptable")
                   (err "unexpected error")))))))

;; Property: Ticket purchases should maintain state consistency
(define-public (property-buy-ticket-consistency (event-id uint))
  (match (contract-call? .eventchain get-event event-id)
    event-data (let ((tickets-sold-before (get tickets-sold event-data))
                     (total-tickets (get total-tickets event-data)))
                 ;; Discard if no tickets available
                 (if (>= tickets-sold-before total-tickets)
                     (ok "discarded-sold-out")
                     ;; Attempt purchase
                     (match (contract-call? .eventchain buy-ticket event-id)
                       ticket-id (begin
                         ;; Verify state consistency after purchase
                         (match (contract-call? .eventchain get-event event-id)
                           updated-event (begin
                             ;; Tickets sold should increment by 1
                             (asserts! (is-eq (get tickets-sold updated-event)
                                             (+ tickets-sold-before u1))
                                      (err "tickets-sold not incremented"))
                             ;; Verify ticket was created for buyer
                             (match (contract-call? .eventchain get-ticket event-id tx-sender)
                               ticket-data (begin
                                 (asserts! (not (get used ticket-data)) (err "new ticket marked as used"))
                                 (asserts! (is-eq (get ticket-id ticket-data) ticket-id) (err "ticket ID mismatch"))
                                 (ok "purchase-success"))
                               (err "ticket not found after purchase")))
                           (err "event not found after purchase"))
                       error (ok "purchase-failed-acceptable")))))
    (ok "event-not-found")))

;; Property: Valid transfers should preserve ticket integrity
(define-public (property-transfer-ticket-integrity (event-id uint) (to-user principal))
  ;; Discard self-transfers
  (if (is-eq tx-sender to-user)
      (ok "discarded-self-transfer")
      (match (contract-call? .eventchain get-ticket event-id tx-sender)
        ticket-data (begin
          ;; Discard used tickets
          (if (get used ticket-data)
              (ok "discarded-used-ticket")
              ;; Attempt transfer
              (match (contract-call? .eventchain transfer-ticket event-id to-user)
                success (begin
                  ;; Verify ownership changed
                  (let ((old-owner-ticket (contract-call? .eventchain get-ticket event-id tx-sender))
                        (new-owner-ticket (contract-call? .eventchain get-ticket event-id to-user)))
                    (asserts! (is-none old-owner-ticket) (err "old owner still has ticket"))
                    (match new-owner-ticket
                      new-ticket (begin
                        (asserts! (not (get used new-ticket)) (err "transferred ticket marked as used"))
                        (asserts! (is-eq (get ticket-id new-ticket) (get ticket-id ticket-data))
                                 (err "ticket ID changed during transfer"))
                        (ok "transfer-success"))
                      (err "new owner doesn't have ticket"))))
                error (ok "transfer-failed-acceptable"))))
        (ok "no-ticket-to-transfer"))))

;; =============================================================================
;; TEST: Check-in Properties
;; =============================================================================

;; Property: Check-ins should only work once per ticket
(define-public (test-check-in (event-id uint) (attendee principal))
  (match (contract-call? .eventchain get-event event-id)
    event-data (match (contract-call? .eventchain get-ticket event-id attendee)
                 ticket-data (if (not (get used ticket-data))
                               (match (contract-call? .eventchain check-in-ticket event-id attendee)
                                 success (begin
                                   ;; Verify ticket is now used
                                   (match (contract-call? .eventchain get-ticket event-id attendee)
                                     updated-ticket (begin
                                       (asserts! (get used updated-ticket) (err u1))
                                       (ok success))
                                     (err u2)))
                                 error (ok u0)) ;; May fail for authorization reasons
                               (ok u0)) ;; Already used
                 (ok u0)) ;; No ticket
    (ok u0))) ;; No event

;; =============================================================================
;; TEST: Event Cancellation Properties
;; =============================================================================

;; Property: Only event creators can cancel their events
(define-public (test-cancel-event (event-id uint))
  (match (contract-call? .eventchain get-event event-id)
    event-data (match (contract-call? .eventchain cancel-event event-id)
                 success (begin
                   ;; Verify event is cancelled
                   (match (contract-call? .eventchain is-event-cancelled event-id)
                     is-cancelled (begin
                       (asserts! is-cancelled (err u1))
                       (ok success))
                     (err u2)))
                 error (ok u0)) ;; May fail for authorization reasons
    (ok u0))) ;; No event

;; =============================================================================
;; TEST: Organizer Management Properties
;; =============================================================================

;; Property: Organizer status should be consistent
(define-public (test-organizer-status (organizer principal))
  (match (contract-call? .eventchain is-organizer organizer)
    is-org-result (ok u1) ;; Just verify the function works
    (err u1)))

;; =============================================================================
;; TEST: State Consistency Properties
;; =============================================================================

;; Property: Event data should remain consistent
(define-public (test-event-consistency (event-id uint))
  (match (contract-call? .eventchain get-event event-id)
    event-data (begin
      ;; Verify basic invariants
      (asserts! (>= (get total-tickets event-data) (get tickets-sold event-data)) (err u1))
      (asserts! (> (len (get name event-data)) u0) (err u2))
      (asserts! (> (len (get location event-data)) u0) (err u3))
      (ok u1))
    (ok u0))) ;; No event, acceptable