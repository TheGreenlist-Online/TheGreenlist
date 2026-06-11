# npm proxy compatibility note

## Issue

npm can print this warning when an environment or configuration source provides an unsupported key:

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
```

This is not a dependency error. It means npm is seeing a config name that it does not recognize as a supported npm config key.

## Supported npm proxy keys

Use npm's supported proxy configuration names:

```bash
npm config set proxy http://user:pass@host:port
npm config set https-proxy http://user:pass@host:port
npm config set noproxy localhost,127.0.0.1
```

For environments that do not require a proxy, remove any `http-proxy` entry from:

- Project `.npmrc`
- User-level `~/.npmrc`
- Global npm config
- CI/CD environment variables
- Vercel project environment variables
- GitHub Actions variables or secrets
- Shell startup files such as `.bashrc`, `.zshrc`, or Termux profile files

## Migration rule

Do not add this key:

```text
http-proxy=...
```

Use this instead when HTTP proxy support is required:

```text
proxy=...
```

Use this when HTTPS registry access also needs the proxy:

```text
https-proxy=...
```

## Project policy

This project includes a project-local `.npmrc` with valid npm config keys only. Proxy URLs should generally stay out of the repository because they can contain credentials or machine-specific network details.

## Future npm major update checklist

Before upgrading to the next npm major version:

1. Run `npm config list --location=project`.
2. Run `npm config list --location=user`.
3. Run `npm config list --location=global`.
4. Confirm there is no `http-proxy` key in any output.
5. Check CI/Vercel/GitHub environment variables for `NPM_CONFIG_HTTP_PROXY`, `http-proxy`, or `npm_config_http_proxy`.
6. Replace any legacy `http-proxy` usage with `proxy` and, when needed, `https-proxy`.
7. Run `npm install` or `npm ci` and confirm the warning is gone.

## Android / Termux note

If this warning appears only on Android or Termux, it may come from a user-level npm config rather than the repository. Check:

```bash
npm config get http-proxy
npm config get proxy
npm config get https-proxy
npm config list --location=user
```

Then remove the unsupported key if present:

```bash
npm config delete http-proxy
```

If a proxy is still needed afterward:

```bash
npm config set proxy http://host:port
npm config set https-proxy http://host:port
```
