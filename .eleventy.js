module.exports = function(eleventyConfig) {
  // Planning documents — not published to the site
  eleventyConfig.ignores.add("_planning/**");

  // Filters
  eleventyConfig.addFilter("find", (array, key, value) =>
    array.find(item => item[key] === value)
  );
  eleventyConfig.addFilter("where", (array, key, value) =>
    array.filter(item => item[key] === value)
  );

  // Copy article directories to output as-is (no template processing)
  eleventyConfig.addPassthroughCopy("instrumentation-journey");

  // Static assets (CSS, fonts, images)
  eleventyConfig.addPassthroughCopy("assets");

  // mobile-sideloading is archived — not published to the site.
  // To restore: add eleventyConfig.addPassthroughCopy("mobile-sideloading")
  // and set its entry in _data/articles.json to published: true.

  return {
    pathPrefix: "/memory-dump/",
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
