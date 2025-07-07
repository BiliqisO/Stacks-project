(define-constant ERR-UNAUTHORIZED (err u0))
(define-constant ERR-ALREADY-REGISTERED (err u1))
(define-constant ERR-INVALID-USER (err u2))
(define-constant ERR-ALREADY-A-STAFF (err u3))
(define-constant ERR-CANNOT-ADD (err u4))

(define-data-var staffs (list 100 principal) (list ))
(define-map users principal { role: uint })
(define-map referal principal {total: uint, referees: (list 100 principal), unclaimed: uint }) 
(define-constant admin contract-caller)
(define-constant staff-role u1)
(define-constant patient-role u2)


(define-public (sign-up (user principal) (referer (optional principal)))
  (let (
    (current_user (map-get? users user))
    (current_referal (default-to {total: u0, referees: (list ), unclaimed: u0} (map-get? referal (default-to contract-caller referer))))
    (referees-list (get referees current_referal))
    (total (get total current_referal))
    (unclaimed (get unclaimed current_referal))
    )
    (if (is-none current_user)
      (begin
        (map-set users user { role: patient-role })
        (if (is-some referer)
          (begin
            (map-set referal (default-to contract-caller referer) { total: (+ total u1), referees: (unwrap! (as-max-len? (append referees-list user) u100) ERR-CANNOT-ADD), unclaimed: (+ unclaimed u1) })
            (map-set referal user { total: u0, referees: (list ), unclaimed: u0 })
          )
          (map-set referal user { total: u0, referees: (list ), unclaimed: u0 })
        )
        (ok true)
      )
      ERR-ALREADY-REGISTERED
    )
  )
)

(define-public (assign-staff (user principal))
  (let (
    (current_user (map-get? users user))
    (staffs-list (var-get staffs))
    )
    (asserts! (is-eq contract-caller admin) ERR-UNAUTHORIZED)
    (asserts! (is-some current_user) ERR-INVALID-USER)
    (asserts! (is-none (index-of? staffs-list user)) ERR-ALREADY-A-STAFF)
    (if (is-some current_user)
      (begin
        (map-set users user { role: staff-role })
        (var-set staffs (unwrap! (as-max-len? (append staffs-list user) u100) ERR-CANNOT-ADD))
        (ok true)
      )
      ERR-INVALID-USER
    )
  )
)

(define-public (claim-referral-rewards)
  (let (
    (current_user (map-get? users contract-caller))
    (current_referal (default-to {total: u0, referees: (list ), unclaimed: u0} (map-get? referal contract-caller)))
    (unclaimed (get unclaimed current_referal))
    )
    (asserts! (is-some current_user) ERR-INVALID-USER)
    (asserts! (> unclaimed u0) ERR-ALREADY-REGISTERED)
    (if (is-some current_user)
      (begin
        (map-set referal contract-caller (merge current_referal {unclaimed: u0}))
        (ok true)
      )
      ERR-INVALID-USER
    )
  )
)

(define-public (get-role (user principal))
  (let (
    (current_user (map-get? users user))
    )
    (if (is-some current_user)
      (ok (get role current_user))
      ERR-INVALID-USER
    )
  )
)
(define-public (get-staffs)
  (let (
    (staffs-list (var-get staffs))
  )
    (ok staffs-list)
  )
)