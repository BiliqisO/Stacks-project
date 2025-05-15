;; @title Health Token (HLTH)
;; @description SIP-010 Compliant Fungible Token for MediVerse
;; @version 1.0
;; @targetstx 2.0

;; Trait Implementation
(define-trait sip-010-trait
  (
    ;; Transfer tokens
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))

    ;; Read-only functions
    (get-name () (response (string-utf8 32) uint))
    (get-symbol () (response (string-utf8 10) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
  )
)

;; Constants
(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-NOT-OWNER u402) 
(define-constant MAX_SUPPLY u1000000000000)

;; Token Definition
(define-fungible-token HLTH MAX_SUPPLY)

;; State
(define-data-var contract-owner principal tx-sender)
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://example.com/health-token.json"))

;; SIP-010 Transfer
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) (err ERR-UNAUTHORIZED))
    (ft-transfer? HLTH amount from to)
  )
)

;; Metadata Getters
(define-read-only (get-name)
  (ok "Health Token")
)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-read-only (get-symbol)
  (ok "HLTH")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply HLTH))
)

(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance HLTH owner))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Admin Functions
(define-public (set-token-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-UNAUTHORIZED))
    (var-set token-uri (some uri))
    (ok true)
  )
)

(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-UNAUTHORIZED))
    (var-set contract-owner new-owner)
    (ok "Ownership transferred successfully")
  )
)

;; Optional: Initial Mint
(begin
  (try! (ft-mint? HLTH u500000000000 (var-get contract-owner)))
)
