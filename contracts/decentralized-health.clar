(define-constant ERR-UNAUTHORIZED (err u0))
(define-constant ERR-ALREADY-REGISTERED (err u1))
(define-constant ERR-INVALID-USER (err u2))
(define-constant ERR-ALREADY-A-STAFF (err u3))
(define-constant ERR-CANNOT-ADD (err u4))

(define-data-var staffs (list 100 principal) (list ))
(define-map users principal { role: uint })
(define-constant admin contract-caller)
(define-constant staff-role u1)
(define-constant patient-role u2)


(define-public (sign-up (user principal))
  (let (
    (current_user (map-get? users user))
    )
    (if (is-none current_user)
      (begin
        (map-set users user { role: patient-role })
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