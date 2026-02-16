import { $ } from 'bun'

export const sslService = {
  async issueCert(domain: string, email: string): Promise<string> {
    return $`certbot --nginx -d ${domain} --email ${email} --agree-tos --non-interactive`
      .nothrow()
      .text()
  },

  async renewAll(): Promise<string> {
    return $`certbot renew`.nothrow().text()
  },

  async listCerts(): Promise<string> {
    return $`certbot certificates`.nothrow().text()
  },

  async revokeCert(domain: string): Promise<string> {
    return $`certbot delete --cert-name ${domain} --non-interactive`
      .nothrow()
      .text()
  },
}