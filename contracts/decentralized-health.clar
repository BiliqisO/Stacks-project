(define-trait nft-trait 
  (
    (transfer (uint principal principal) (response bool uint))
    (get-owner (uint) (response principal uint))
    (mint (principal) (response uint uint))
  )
)

(define-trait ft-trait 
  (
    (transfer (uint principal principal) (response bool uint))
    (mint (principal uint) (response bool uint))
  )
)

(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_ROLE_EXISTS (err u402))

;; Role types
(define-constant ROLE_PATIENT u1)
(define-constant ROLE_MEDICAL u2)
(define-constant ROLE_ADMIN u3)
(define-constant ROLE_EXECUTIVE u4)
(define-constant ROLE_NON_MEDICAL u5)

(define-data-var user-id-nft (map principal uint)) ;; mapping from user to identity NFT ID
(define-data-var user-role-nft (map principal uint)) ;; mapping from user to role NFT ID
(define-data-var user-role (map principal uint)) ;; actual role type
(define-map service-registry ((name (string-ascii 50))) ((cost uint) (roles (list 10 uint))))

(define-map referrals ((user principal)) (referrer principal))

(define-data-var user-ft (map principal uint)) ;; token balance for users

;; Assume we already have NFT and FT contracts deployed elsewhere
(define-constant identity-nft-contract 'ST123.identity-nft)
(define-constant role-nft-contract 'ST123.role-nft)
(define-constant health-ft-contract 'ST123.health-token)

(define-public (signup)
  (begin
    (if (map-get? user-id-nft tx-sender)
        (err u100) ;; Already signed up
        (let
          (
            (id-nft-id (unwrap! (contract-call? identity-nft-contract mint tx-sender) (err u101)))
            (role-id (unwrap! (contract-call? role-nft-contract mint tx-sender) (err u102)))
          )
          (begin
            (map-set user-id-nft tx-sender id-nft-id)
            (map-set user-role-nft tx-sender role-id)
            (map-set user-role tx-sender ROLE_PATIENT)
            (contract-call? health-ft-contract mint tx-sender u100) ;; Signup reward
            (ok true)
          )
        )
    )
  )
)

(define-public (assign-role (user principal) (role uint))
  (begin
    (if (is-eq tx-sender 'ST123.contract-admin)
        (begin
          (map-set user-role user role)
          (ok true)
        )
        ERR_UNAUTHORIZED
    )
  )
)

(define-public (reward-user (user principal) (amount uint))
  (begin
    (if (is-eq tx-sender 'ST123.contract-admin)
        (contract-call? health-ft-contract mint user amount)
        ERR_UNAUTHORIZED
    )
  )
)

(define-read-only (get-user-role (user principal))
  (match (map-get? user-role user)
    role (ok role)
    (err u404)
  )
)

(define-read-only (get-user-ft-balance (user principal))
  (match (map-get? user-ft user)
    balance (ok balance)
    (ok u0)
  )
)
(define-public (register-service (name (string-ascii 50)) (cost uint) (roles (list 10 uint)))
  (begin
    (if (is-eq tx-sender 'ST123.contract-admin)
        (begin
          (map-set service-registry ((name name)) ((cost cost) (roles roles)))
          (ok true)
        )
        (err u401)
    )
  )
)

(define-public (access-service (name (string-ascii 50)))
  (let
    (
      (service (map-get? service-registry ((name name))))
      (user-role (unwrap-panic (map-get? user-role tx-sender)))
    )
    (match service
      {cost, roles} =>
        (if (contains? roles user-role)
            (begin
              (contract-call? health-ft-contract transfer cost tx-sender 'ST123.hospital-wallet)
              (ok true)
            )
            (err u403) ;; forbidden
        )
      (err u404)
    )
  )
)

(define-public (refer (new-user principal))
  (begin
    (map-set referrals ((user new-user)) tx-sender)
    (ok true)
  )
)

(define-public (reward-referral (new-user principal))
  (let ((referrer (map-get? referrals ((user new-user)))))
    (match referrer
      some-ref =>
        (contract-call? health-ft-contract mint some-ref u50)
      (err u404)
    )
  )
)