import { withSentryConfig } from "@sentry/nextjs";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const analyzeEnabled = process.env.ANALYZE === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"]
  },
  webpack(config, { isServer, nextRuntime }) {
    // Only analyze the client bundle. @next/bundle-analyzer's default wrapper
    // also attaches to the Node.js server and edge compilers, which on this
    // Next.js 15 app-router setup produces mismatched chunk IDs between the
    // analyzer's stats pass and the emitted webpack-runtime manifest,
    // breaking `next build` with "Cannot find module './NNNN.js'". Scoping
    // the plugin to the client compiler avoids that entirely and is also all
    // we need for First Load JS analysis.
    if (analyzeEnabled && !isServer && nextRuntime === undefined) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: "../.next/analyze/client.html",
          openAnalyzer: false
        })
      );
    }
    return config;
  }
};

const configWithAnalyzer = nextConfig;

// withSentryConfig stays inert without an auth token: source-map upload only
// runs when SENTRY_AUTH_TOKEN is present, and the sentry.build.org/project
// values below are read from env so a DSN-less build never attempts a
// network call to Sentry.
export default withSentryConfig(configWithAnalyzer, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps when we actually have credentials to do so.
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Skip the Sentry CLI source-map upload step entirely when there's no
  // auth token — otherwise a DSN-less/token-less CI build would try to talk
  // to Sentry's API and fail the build.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN
  },

  webpack: {
    // Don't create Vercel cron monitors etc. in this app.
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true
    }
  },

  // Avoid tunneling route unless explicitly desired (keeps middleware surface
  // area the same as before this change when no DSN is configured).
  tunnelRoute: undefined
});
