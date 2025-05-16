;; SPDX-License-Identifier: MIT
;; RoleNFT - SIP-009 NFT with role assignment and metadata

(define-trait sip009-nft-trait
  (
    (get-balance (principal) (response uint uint))
    (get-owner (uint) (response principal uint))
    (get-token-uri (uint) (response (string-utf8 256) uint))
    (transfer (uint principal principal) (response bool uint))
  )
)



(define-non-fungible-token role-nft uint)

(define-data-var role-token-counter uint u0)
(define-data-var contract-owner principal tx-sender)



;; Enum-style roles
(define-constant ROLE_PATIENT u0)
(define-constant ROLE_MEDICAL_STAFF u1)
(define-constant ROLE_ADMIN_STAFF u2)
(define-constant ROLE_EXECUTIVE u3)
(define-constant ROLE_NON_MEDICAL_STAFF u4)

;; Maps token ID to metadata URI
(define-map role-token-uris { token-id: uint } { uri: (string-utf8 256) })

(define-map owner-balances { owner: principal } { count: uint })

;; Maps token ID to assigned role
(define-map role-of { token-id: uint } { role: uint })
(define-read-only (is-owner (sender principal))
  (is-eq sender (var-get contract-owner))
)

;; (define-public (set-token-uri (uri (string-utf8 256)))
;;   (begin
;;     (asserts! (is-eq tx-sender contract-owner) (err u401))
;;     (var-set token-uri uri)
;;     (ok true)
;;   )
;; )

(define-public (mint-role (recipient principal) (role uint) (uri (string-utf8 256)))
  (if (not (<= role ROLE_NON_MEDICAL_STAFF))
      (err u400)
      (let ((next-id (+ u1 (var-get role-token-counter))))
        (begin
          (var-set role-token-counter next-id)
          (map-set role-token-uris { token-id: next-id } { uri: uri })
          (map-set role-of { token-id: next-id } { role: role })
           (increment-owner-count recipient)
          (var-set role-token-counter (+ next-id u1))
          (nft-mint? role-nft next-id recipient)
        )
      )
))

(define-read-only (get-token-uri (id uint))
  (match (map-get? role-token-uris { token-id: id })
    uri-data (ok (get uri uri-data))
    (err u404)
  )
)

(define-private (increment-owner-count (who principal))
  (let (
    (current (default-to u0 (get count (map-get? owner-balances { owner: who }))))
  )
    (map-set owner-balances { owner: who } { count: (+ current u1) })
  )
)

;; Call this from `mint-role` after successful mint

;; SIP-009 required functions
(define-read-only (get-owner (id uint))
  (nft-get-owner? role-nft id)
)

(define-read-only (get-role (id uint))
  (match (map-get? role-of { token-id: id })
    some-data (ok (get role some-data))
    (err u404)
  )
)
(define-read-only (get-balance (who principal))
  (match (map-get? owner-balances { owner: who })
    some-data (ok (get count some-data))
    (ok u0)
  )
)



(define-public (transfer (id uint) (sender principal) (recipient principal))
  (nft-transfer? role-nft id sender recipient)
)
