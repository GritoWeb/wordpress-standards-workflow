<?php

namespace App\Blocks;

/**
 * Registers the team's custom block category in Gutenberg.
 *
 * Every block scaffolded by the `create-block` skill defaults to this
 * category, so they group together in the inserter instead of being
 * scattered across core categories. Edit SLUG / TITLE here to rename;
 * remember to update existing block.json files' `category` value to
 * match if you change SLUG.
 */
class BlockCategories
{
    public const SLUG = 'custom-blocks';
    public const TITLE = 'Custom Blocks';

    public static function register(): void
    {
        add_filter('block_categories_all', function (array $categories): array {
            $filtered = array_values(array_filter(
                $categories,
                fn ($cat) => ($cat['slug'] ?? '') !== self::SLUG
            ));

            array_unshift($filtered, [
                'slug'  => self::SLUG,
                'title' => self::TITLE,
                'icon'  => null,
            ]);

            return $filtered;
        }, 5);
    }
}
