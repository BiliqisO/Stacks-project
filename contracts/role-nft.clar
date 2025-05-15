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

(impl-trait .sip009-nft-trait)

(define-non-fungible-token role-nft uint)

(define-data-var role-token-counter uint u0)

;; Enum-style roles
(define-constant ROLE_PATIENT u0)
(define-constant ROLE_MEDICAL_STAFF u1)
(define-constant ROLE_ADMIN_STAFF u2)
(define-constant ROLE_EXECUTIVE u3)
(define-constant ROLE_NON_MEDICAL_STAFF u4)

;; Maps token ID to metadata URI
(define-map role-token-uris { token-id: uint } { uri: (string-utf8 256) })

;; Maps token ID to assigned role
(define-map role-of { token-id: uint } { role: uint })
(define-public (set-token-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender admin) (err u401))
    (var-set token-uri uri)
    (ok true)
  )
)
(define-public (mint-role (recipient principal) (role uint) (uri (string-utf8 256)))
  (if (not (<= role ROLE_NON_MEDICAL_STAFF))
      (err u400)
      (let ((next-id (+ u1 (var-get role-token-counter))))
        (begin
          (var-set role-token-counter next-id)
          (map-set role-token-uris { token-id: next-id } { uri: uri })
          (map-set role-of { token-id: next-id } { role: role })
          (nft-mint? role-nft next-id recipient)
        )
      )
))

;; Get token URI
(define-read-only (get-token-uri (id uint))
  (match (map-get role-token-uris { token-id: id })
    some (ok (get uri some))
    none (err u404)
  )
)

;; Get role of a token
(define-read-only (get-role (id uint))
  (match (map-get role-of { token-id: id })
    some (ok (get role some))
    none (err u404)
  )
)

;; SIP-009 required functions
(define-read-only (get-owner (id uint))
  (nft-get-owner? role-nft id)
)

(define-read-only (get-balance (who principal))
  (ok (nft-get-balance role-nft who))
)

(define-public (transfer (id uint) (sender principal) (recipient principal))
  (nft-transfer? role-nft id sender recipient)
)
