import checkFilter from '../../../src/backend/services/check_filter';

describe('check_filter', () => {

    it('succeeds if no operators are present', () => {
        expect(checkFilter({name: 'john', foo: { bar: 2 }})).toBeTruthy();
    });

    it('succeeds if valid operators are present', () => {
        expect(checkFilter({$or: [{foo: {$exists: true}}, {html: {$containsi: 'test'}}]})).toBeTruthy();
    });

    it('fails if valid operators are present', () => {
        expect(checkFilter({$xor: [{foo: {$exists: true}}, {html: {$containsi: 'test'}}]})).toBeFalsy();
    });

});


