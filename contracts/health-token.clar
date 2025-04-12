(impl-trait 'SP3FTKFT7.health-token-ft-trait)

(define-constant token-name "Health Token")
(define-constant token-symbol "HLTH")
(define-constant token-decimals u6)

(define-map balances ((owner principal)) uint)
(define-map allowances ((owner principal) (spender principal)) uint)
(define-data-var total-supply uint u0)

(define-read-only (get-name) (ok token-name))
(define-read-only (get-symbol) (ok token-symbol))
(define-read-only (get-decimals) (ok token-decimals))
(define-read-only (get-total-supply) (ok (var-get total-supply)))
(define-read-only (get-balance-of (owner principal))
  (ok (default-to u0 (map-get? balances (tuple (owner owner))))))

(define-public (mint (recipient principal) (amount uint))
  (begin
    (var-set total-supply (+ (var-get total-supply) amount))
    (map-set balances (tuple (owner recipient)) (+ (default-to u0 (map-get? balances (tuple (owner recipient)))) amount))
    (ok true)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (let ((sender-bal (default-to u0 (map-get? balances (tuple (owner sender))))))
    (if (>= sender-bal amount)
        (begin
          (map-set balances (tuple (owner sender)) (- sender-bal amount))
          (map-set balances (tuple (owner recipient)) (+ (default-to u0 (map-get? balances (tuple (owner recipient)))) amount))
          (ok true)
        )
        (err u100)
    )
  )
)
