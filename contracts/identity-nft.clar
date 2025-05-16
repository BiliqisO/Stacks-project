;; SPDX-License-Identifier: MIT
;; Identity NFT Smart Contract
;; Implements basic minting and metadata storage
;; SIP-009 Compliant

(define-trait sip009-nft-trait
  (
    ;; Get balance of NFTs owned by a principal
    (get-balance (principal) (response uint uint))
    ;; Get owner of a specific token
    (get-owner (uint) (response principal uint))
    ;; Get token URI metadata
    (get-token-uri (uint) (response (string-utf8 256) uint))
    ;; Transfer a token
    (transfer (uint principal principal) (response bool uint))
  )
)


(define-non-fungible-token identity-nft uint)


;; Track token counter
(define-data-var token-counter uint u0)

;; Mapping of token-id to token URI
(define-map token-uris { token-id: uint } { uri: (string-utf8 256) })
(define-map identity-balances { owner: principal } { count: uint })
(define-map role-token-uris { token-id: uint } { uri: (string-utf8 256) })



;; Owner of the contract (optional auth logic)
(define-constant contract-owner 'ST1994Y3P6ZDJX476QFSABEFE5T6YMTJT0T7RSQDW.aimeme-token-owner)

;; Public mint function
(define-public (mint-identity (recipient principal) (uri (string-utf8 256)))
(begin
  (let ((next-id (+ u1 (var-get token-counter))))
    (var-set token-counter next-id)
    (map-set token-uris { token-id: next-id } { uri: uri })
    (increment-balance recipient) 
    (var-set token-counter (+ next-id u1))
    (nft-mint? identity-nft next-id recipient)
  )
)

)

;; Read-only function to get token URI

(define-read-only (get-token-uri (id uint))
  (match (map-get? role-token-uris { token-id: id })
    uri-data (ok (get uri uri-data))
    (err u404)
  )
)

;; SIP-009 required functions

(define-read-only (get-owner (id uint))
  (nft-get-owner? identity-nft id)
)
(define-private (increment-balance (who principal))
  (let (
    (current (default-to u0 (get count (map-get? identity-balances { owner: who }))))
  )
    (map-set identity-balances { owner: who } { count: (+ current u1) })
  )
)
(define-private (decrement-balance (who principal))
  (let (
    (current (default-to u0 (get count (map-get? identity-balances { owner: who }))))
  )
    (map-set identity-balances { owner: who } { count: (if (> current u0) (- current u1) u0) })
  )
)


(define-read-only (get-balance (who principal))
  (match (map-get? identity-balances { owner: who })
    some-data (ok (get count some-data))
    (ok u0)
  )
)


(define-public (transfer (id uint) (sender principal) (recipient principal))
   (begin
    (decrement-balance sender)
    (increment-balance recipient)
    (nft-transfer? identity-nft id sender recipient)
  )
)
