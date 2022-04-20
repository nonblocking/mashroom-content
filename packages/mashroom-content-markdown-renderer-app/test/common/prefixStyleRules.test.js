
import prefixStyleRules from '../../src/js/common/prefixStyleRules';

describe('prefixStyleRules', () => {

    it('prefixes all selectors', async () => {
        const css = `
.my-class {
    color: red;
    font-weight: bold;
}


    h2, h3 {
        font-size: 44px;
    }
        `;

        const processedCSS = prefixStyleRules('__prefix__', css);

        expect(processedCSS).toBe(' .__prefix__ .my-class { color: red; font-weight: bold; } .__prefix__ h2, .__prefix__ h3 { font-size: 44px; }');
    });


    it('wraps all top level CSS properties', async () => {
        const css = `
            .my-class {
                color: red;
                font-weight: bold;
            }

            color: blue;

            h2 {
                font-size: 44px;
            }
        `;

        const processedCSS = prefixStyleRules('__prefix__', css);

        expect(processedCSS).toBe(' .__prefix__ .my-class { color: red; font-weight: bold; } .__prefix__ { color: blue; } .__prefix__ h2 { font-size: 44px; }');
    });

    it('wraps rules within media queries', async () => {
        const css = `
            .my-class {
                color: red;
                font-weight: bold;
            }

            @media (min-width: 768px) {
                color: blue;

                h2 {
                    font-size: 44px;
                }
            }
        `;

        const processedCSS = prefixStyleRules('__prefix__', css);

        expect(processedCSS).toBe(' .__prefix__ .my-class { color: red; font-weight: bold; } @media (min-width: 768px) { .__prefix__ { color: blue; } .__prefix__ h2 { font-size: 44px; } }');
    });

    it('deals with multiple rules in a line', async () => {
        const css = `.my-class { color: red; font-weight: bold; } h2, h3 { font-size: 44px; }`;

        const processedCSS = prefixStyleRules('__prefix__', css);

        expect(processedCSS).toBe(' .__prefix__ .my-class { color: red; font-weight: bold; } .__prefix__ h2, .__prefix__ h3 { font-size: 44px; }');
    });


});
