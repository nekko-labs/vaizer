/**
 * Renders a schema.org JSON-LD block. Search engines and answer engines read
 * this to describe Vaizer (and each skill) accurately instead of inferring it
 * from the markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own data files, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
