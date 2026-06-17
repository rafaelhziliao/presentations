module.exports = function(eleventyConfig) {
  // Copy article directories to output as-is (no template processing)
  eleventyConfig.addPassthroughCopy("instrumentation-journey");

  // Static assets (CSS, fonts, images)
  eleventyConfig.addPassthroughCopy("assets");

  // mobile-sideloading is archived — not published to the site.
  // To restore: add eleventyConfig.addPassthroughCopy("mobile-sideloading")
  // and set its entry in _data/articles.json to published: true.

  return {
    dir: {
      input: ".",
      output: "_site",
      data: "_data",
      includes: "_includes"
    },
    // Process .html and .njk files as Nunjucks templates
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"]
  };
};
