const { API_OPERATIONS, assertReferencesResolve } = require('../../test-data/openApi');

describe('CashHub API operation contracts', () => {
  test.each(API_OPERATIONS)(
    '$method $path has a valid documented contract',
    ({ path, operation }) => {
      expect(path).toMatch(/^\/(?!\/)/);
      expect(operation.responses).toBeDefined();
      expect(Object.keys(operation.responses).some(status => status.startsWith('2'))).toBe(true);

      const pathParameters = [...path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => name);
      const documentedPathParameters = (operation.parameters || [])
        .filter(parameter => parameter.in === 'path')
        .map(parameter => parameter.name);

      expect(documentedPathParameters).toEqual(expect.arrayContaining(pathParameters));
      expect((operation.parameters || [])
        .filter(parameter => pathParameters.includes(parameter.name))
        .every(parameter => parameter.required === true)).toBe(true);

      if (operation.requestBody) {
        expect(Object.keys(operation.requestBody.content || {}).length).toBeGreaterThan(0);
      }

      assertReferencesResolve(operation);
    }
  );
});
