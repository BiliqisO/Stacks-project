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

(impl-trait .sip009-nft-trait)

(define-non-fungible-token identity-nft uint)

;; Track token counter
(define-data-var token-counter uint u0)

;; Mapping of token-id to token URI
(define-map token-uris { token-id: uint } { uri: (string-utf8 256) })

;; Owner of the contract (optional auth logic)
(define-constant contract-owner 'ST1994Y3P6ZDJX476QFSABEFE5T6YMTJT0T7RSQDW.aimeme-token-owner)

;; Public mint function
(define-public (mint-identity (recipient principal) (uri (string-utf8 256)))
  (begin
    (let ((next-id (+ u1 (var-get token-counter))))
      (var-set token-counter next-id)
      (map-set token-uris { token-id: next-id } { uri: uri })
      (nft-mint? identity-nft next-id recipient)
    )
  )
)

;; Read-only function to get token URI
(define-read-only (get-token-uri (id uint))
  (match (map-get token-uris { token-id: id })
    some-data (ok (get uri some-data))
    none (err u404)
  )
)

;; SIP-009 required functions

(define-read-only (get-owner (id uint))
  (nft-get-owner? identity-nft id)
)

(define-read-only (get-balance (owner principal))
  (ok (nft-get-balance identity-nft owner))
)

(define-public (transfer (id uint) (sender principal) (recipient principal))
  (nft-transfer? identity-nft id sender recipient)
)
