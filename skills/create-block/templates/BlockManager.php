<?php

namespace App\Blocks;

class BlockManager
{
    /**
     * Folders under resources/blocks/ (each must contain a block.json).
     */
    protected array $blocks = [
        // Add slugs here as blocks are scaffolded.
    ];

    /**
     * Gutenberg block namespace — the prefix used in each block's `block.json`
     * `name` field (e.g., "sage/<slug>"). Not used internally by BlockManager;
     * exposed via getNamespace() so external tooling (the `create-block` skill)
     * knows what prefix to put in new block.json files.
     *
     * Not the same as:
     *   - PHP namespace `App\` (composer PSR-4 autoload, in composer.json)
     *   - Text domain `sage` (used by __('...', 'sage') for translations)
     */
    protected string $namespace = 'sage';

    protected function globalAttributes(): array
    {
        return [
            'paddingVertDesktop' => ['type' => 'number',  'default' => 112],
            'paddingVertMobile'  => ['type' => 'number',  'default' => 56],
            'paddingXDesktop'    => ['type' => 'boolean', 'default' => true],
            'paddingXMobile'     => ['type' => 'boolean', 'default' => true],
        ];
    }

    public function register(): void
    {
        foreach ($this->blocks as $blockName) {
            $this->registerSingleBlock($blockName);
        }
    }

    protected function registerSingleBlock(string $blockName): void
    {
        $blockPath = get_template_directory() . "/resources/blocks/{$blockName}";
        $blockJson = "{$blockPath}/block.json";

        if (!is_dir($blockPath) || !file_exists($blockJson)) {
            return;
        }

        $metadata   = json_decode(file_get_contents($blockJson), true);
        $blockAttrs = $metadata['attributes'] ?? [];

        $mergedAttributes = array_merge($this->globalAttributes(), $blockAttrs);

        register_block_type($blockPath, ['attributes' => $mergedAttributes]);
    }

    public function addBlock(string $blockName): void
    {
        if (!in_array($blockName, $this->blocks, true)) {
            $this->blocks[] = $blockName;
        }
    }

    public function getBlocks(): array
    {
        return $this->blocks;
    }

    public function getNamespace(): string
    {
        return $this->namespace;
    }
}
