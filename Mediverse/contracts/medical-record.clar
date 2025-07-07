;; SPDX-License-Identifier: MIT

;; MediVerse: Role-based Medical Record Access Contract

(define-trait sip009-nft-trait
  (
    (get-balance (principal) (response uint uint))
    (get-owner (uint) (response principal uint))
    (get-token-uri (uint) (response (string-utf8 256) uint))
    (transfer (uint principal principal) (response bool uint))
  )
)

(define-non-fungible-token identity-nft uint)

(define-data-var token-counter uint u0)

;; Role constants
(define-constant ROLE_PATIENT u0)
(define-constant ROLE_MEDICAL_STAFF u1)
(define-constant ROLE_INSURER u2)

;; Token metadata
(define-map token-uris { token-id: uint } { uri: (string-utf8 256) })
(define-map access-balances { owner: principal } { count: uint })
(define-map token-roles { token-id: uint } { role: uint })
(define-map principal-to-token-id { owner: principal } { token-id: uint })

;; Medical record pointer for each patient
(define-map medical-records { patient: principal } { record-uri: (string-utf8 256) })

;; Access permissions: who can access a patients data
(define-map access-permissions { patient: principal, grantee: principal } { granted: bool })


;; Mint a role NFT
(define-public (mint-role (recipient principal) (role uint) (uri (string-utf8 256)))
   (if (not (<= role ROLE_INSURER))
      (err u400)
      (let ((next-id (+ u1 (var-get token-counter))))
        (begin
          (var-set token-counter next-id)
          (map-set token-uris { token-id: next-id } { uri: uri })
          (increment-balance recipient) 
          (map-set token-roles { token-id: next-id } { role: role })
          (map-set principal-to-token-id { owner: recipient } { token-id: next-id })
          (nft-mint? identity-nft next-id recipient)
        )
      )
    )
)
;; Upload or update a patient's record (IPFS pointer)
(define-public (set-medical-record (patient principal) (record-uri (string-utf8 256)))
  (let ((maybe-id (map-get? principal-to-token-id { owner: tx-sender })))
    (match maybe-id
      token-data
        (match (map-get? token-roles { token-id: (get token-id token-data) })
          role-data
            (if (is-eq (get role role-data) ROLE_MEDICAL_STAFF)
            (match (map-get? access-permissions { patient: patient, grantee: tx-sender })
                permission
                    (if (get granted permission)
                        (begin
                            (map-set medical-records { patient: tx-sender } { record-uri: record-uri })
                            (ok true)
                        )
           (err u403)
            )
            (err u403)
            )
            (err u401)
            )
            (err u404)
            )
            (err u404)
            )
            )
    )




;; Grant access to a specific grantee
(define-public (grant-access (grantee principal))
  (begin
    (map-set access-permissions { patient: tx-sender, grantee: grantee } { granted: true })
    (ok true)
  )
)

;; Revoke access from a specific grantee
(define-public (revoke-access (grantee principal))
  (begin
    (map-set access-permissions { patient: tx-sender, grantee: grantee } { granted: false })
    (ok true)
  )
)

;; Read a patient's medical record if permitted
(define-read-only (get-medical-record (patient principal))
  (match (map-get? access-permissions { patient: patient, grantee: tx-sender })
    access-perm
      (if (is-eq (get granted access-perm) true)
        (match (map-get? medical-records { patient: patient })
          record (ok (get record-uri record))
          (err u404)
        )
        (err u403)
      )
    (err u403)
  )
)

;; SIP-009 functions

(define-read-only (get-owner (id uint))
  (nft-get-owner? identity-nft id)
)

(define-read-only (get-token-uri (id uint))
  (match (map-get? token-uris { token-id: id })
    some-uri (ok (get uri some-uri))
    (err u404)
  )
)

(define-public (transfer (id uint) (sender principal) (recipient principal))
  (nft-transfer? identity-nft id sender recipient)
)

(define-private (increment-balance (who principal))
  (let (
    (current (default-to u0 (get count (map-get? access-balances { owner: who }))))
  )
    (map-set access-balances { owner: who } { count: (+ current u1) })
  )
)
(define-private (decrement-balance (who principal))
  (let (
    (current (default-to u0 (get count (map-get? access-balances { owner: who }))))
  )
    (map-set access-balances { owner: who } { count: (if (> current u0) (- current u1) u0) })
  )
)
(define-read-only (get-balance (who principal))
  (match (map-get? access-balances { owner: who })
    some-data (ok (get count some-data))
    (ok u0)
  )
)

(define-read-only (get-role (id uint))
  (match (map-get? token-roles { token-id: id })
    some-role (ok (get role some-role))
    (err u404)
  )
)
