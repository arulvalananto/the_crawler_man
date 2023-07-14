const cheerio = require('cheerio');

const constants = require('./constants');
const { estimateReadingTime, extractKeywords } = require('./helpers');

/**
 * Extract webpage data
 */
class ExtractWeb {
    /**
     * Constructor function for ExtractWeb
     * @param {string} url
     * @param {string} html
     */
    constructor(url, html) {
        this.url = url;
        this.$ = cheerio.load(html);
    }

    /**
     * Get website url
     * @return {string} url
     */
    getUrl() {
        return this.url;
    }

    /**
     * Get information from Meta
     * @param {string} value
     * @param {string} name
     * @param {string} attr
     * @return {string} content
     */
    meta(value, name = constants.PROPERTY, attr = constants.CONTENT) {
        return this.$(`meta[${name}="${value}"]`).attr(attr);
    }

    /**
     * Get title information from webpage
     * @return {string} title
     */
    getTitle() {
        return this.$(constants.TITLE).text() || constants.UNTITLED;
    }

    /**
     * Get thumbnail information from webpage
     * @return {string} thumbnail
     */
    getThumbnail() {
        return this.meta(constants.OG_IMAGE);
    }

    /**
     * Extract site name form url
     * @return {string} site_name
     */
    getSiteName() {
        return (
            this.meta(constants.OG_SITE_NAME) ||
            this.meta(constants.NAME, constants.ITEM_PROP) ||
            this.meta(constants.TWITTER_SITE, constants.NAME)
        );
    }

    /**
     * Extract description from url
     * @return {string} description
     */
    getDescription() {
        return (
            this.$(constants.META_DESCRIPTION).text() ||
            this.meta(constants.OG_DESCRIPTION) ||
            this.meta(constants.TWITTER_DESCRIPTION) ||
            ''
        );
    }

    /**
     * Get type of website from url
     * @return {string} type
     */
    getType() {
        return this.meta(constants.OG_TYPE) || '';
    }

    /**
     * Get keywords from url content / meta tag
     * @return {string[]} keywords
     */
    getKeywords() {
        const keywords = this.meta(constants.KEYWORDS) || [];

        if (keywords.length) return keywords;
        else {
            const title = this.getTitle();
            const description = this.getDescription();

            const textContent = this.$(constants.HEADER_SELECTOR).text();
            const combineContent = `${title} ${description} ${textContent}`;
            return extractKeywords(combineContent);
        }
    }

    /**
     * Get website logo
     * @return {string} logo
     */
    getLogo() {
        return this.$(constants.IMAGE_WITH_LOGO).attr(constants.SOURCE);
    }

    /**
     * Extract author name
     * @return {string} author
     */
    getAuthor() {
        return (
            this.meta(constants.OG_AUTHOR) ||
            this.meta(constants.AUTHOR, constants.NAME)
        );
    }

    /**
     * Extractor for icons
     * @param {string} name
     * @param {string} type
     * @return {any[]} icons[]
     */
    getIconExtractor(name, type) {
        const arr = [];

        this.$(name).each((_, element) => {
            const href = this.$(element).attr(constants.HREF);
            const sizes = this.$(element).attr(constants.SIZES);

            arr.push({
                type,
                sizes: sizes ? sizes : constants.DEFAULT_ICON_SIZE,
                href,
            });
        });

        return arr;
    }

    /**
     * Extract icons from url
     * @return {any[]} icons
     */
    getIcons() {
        const icons = this.getIconExtractor(
            constants.ICON_SELECTOR,
            constants.ICON
        );
        const appleIcons = this.getIconExtractor(
            constants.APPLE_ICON_SELECTOR,
            constants.APPLE_TOUCH_ICON
        );
        const maskIcons = this.getIconExtractor(
            constants.MASK_ICON_SELECTOR,
            constants.MASK_ICON
        );

        return [...icons, ...appleIcons, ...maskIcons];
    }

    /**
     * Measure reading time for the website if it is an article.
     * @return {number} reading_time
     */
    getReadingTime() {
        const type = this.meta(constants.OG_TYPE);
        if (type === constants.ARTICLE) {
            const content = this.$(constants.HEADER_WITH_PARAGRAPH).text();

            const readingTime = estimateReadingTime(content);
            return readingTime;
        }
        return undefined;
    }

    /**
     * Gather website info
     * @return {any} data
     */
    getData() {
        return {
            url: this.getUrl(),
            type: this.getType(),
            logo: this.getLogo(),
            title: this.getTitle(),
            author: this.getAuthor(),
            iconSet: this.getIcons(),
            siteName: this.getSiteName(),
            thumbnail: this.getThumbnail(),
            description: this.getDescription(),
            keywords: this.getKeywords(),
            readingTime: this.getReadingTime(),
        };
    }
}

module.exports = ExtractWeb;