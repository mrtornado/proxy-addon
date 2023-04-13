export default interface Proxy {
  host: string;
  port: string;
  username?: string | null;
  password?: string | null;
  isActive: boolean;
  headersActive: boolean;
  language?: string;
  timezone?: string;
}
