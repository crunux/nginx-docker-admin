export interface Subdomain {
  name:       string
  subdomain:  string
  domain:     string
  fullDomain: string
  port:       number
  enabled:    boolean
  hasSSL:     boolean
  config:     string
}
