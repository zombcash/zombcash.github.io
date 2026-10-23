# Survivor Field Manual — publishing checklist

This is a static GitHub Pages archive. Keep each article card in the HTML so search engines can discover the title, summary, publication date and internal link without relying on JavaScript.

## Add a new article

1. Create the article as a standalone HTML page in the repository root. Give it a unique, descriptive URL and include a self-referencing canonical URL, unique title and meta description, Open Graph/Twitter metadata, and valid Article or WebPage JSON-LD.
2. Add an article card to `survivor-field-manual.html` and to each localized `<locale>/survivor-field-manual.html` page. Keep the actual article title and target URL consistent across versions; translate the summary, category and keywords for each language.
3. Each card must have these attributes so filters work:
   - `data-date="YYYY-MM-DD"` — actual publication/update date.
   - `data-popularity="number"` — editorial ranking until real analytics are connected. Do not describe it as actual page views.
   - `data-category="lowercase-category"` — must match a category option in that page's selector.
   - `data-keywords="comma-separated keywords"` and `data-title="lowercase title"`.
4. Display a visible date using `<time datetime="YYYY-MM-DD">`, a short useful summary, and translated keywords. Avoid keyword stuffing or claims that a token is guaranteed safe.
5. Add the article URL to `sitemap.xml`. For each translated article, only add reciprocal `hreflang` alternates when that language version actually exists. Keep the manual landing-page hreflang set reciprocal across all nine current language URLs.
6. Check all internal links, canonical URLs, JSON-LD syntax, sitemap XML, mobile layout, language selector and filter behavior before merging.

## Current languages

English, German, French, Russian, Japanese, Turkish, Italian, Hindi and Simplified Chinese. The landing pages are localized; the linked long-form articles are currently English until translated article editions are published.
