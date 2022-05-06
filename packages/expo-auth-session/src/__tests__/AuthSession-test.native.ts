import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import { ExpoClientConfig } from 'expo-constants/build/Constants.types';

type ConstantsType = typeof Constants;
type ConstantsWithoutManifests = Omit<ConstantsType, 'manifest' | 'manifest2'>;

type LegacyManifestPartial = Partial<ConstantsType['manifest']>;
type NewManifestPartial = Partial<ConstantsType['manifest2']>;

type LegacyOrNewManifest =
  | {
      manifest: LegacyManifestPartial;
      manifest2: null;
    }
  | {
      manifest: null;
      manifest2: NewManifestPartial;
    };

type ManifestType = 'legacy' | 'new';
const describeManifestTypes =
  (manifest: LegacyManifestPartial, manifest2: NewManifestPartial) =>
  (fn: (type: ManifestType, mObj: LegacyOrNewManifest) => any, timeout?: number) =>
    describe.each<[ManifestType, LegacyOrNewManifest]>([
      ['legacy', { manifest, manifest2: null }],
      ['new', { manifest: null, manifest2 }],
    ])('with manifest type %p', fn, timeout);

function mockConstants(
  constants: Partial<ConstantsWithoutManifests>,
  manifestProvider: LegacyOrNewManifest
): void {
  jest.doMock('expo-constants', () => {
    const ConstantsModule = jest.requireActual('expo-constants');
    const { default: Constants } = ConstantsModule;
    return {
      ...ConstantsModule,
      // must explicitly include this in order to mock both default and named exports
      __esModule: true,
      default: {
        ...Constants,
        ...constants,
        ...manifestProvider,
      },
    };
  });
}

function mockBareExecutionEnvironment(
  constants: Partial<ConstantsWithoutManifests>,
  manifestProvider: LegacyOrNewManifest
): void {
  jest.doMock('expo-constants', () => {
    const ConstantsModule = jest.requireActual('expo-constants');
    return {
      ...ConstantsModule,
      // must explicitly include this in order to mock both default and named exports
      __esModule: true,
      default: {
        executionEnvironment: ExecutionEnvironment.Bare,
        ...manifestProvider,
      },
    };
  });
}

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe('bare', () => {
  const originalWarn = console.warn;
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => (console.warn = originalWarn));

  describeManifestTypes(
    { id: 'test' },
    { id: 'fake-uuid' }
  )((_type, manifestObj) => {
    it(`throws if no scheme is provided or defined`, () => {
      mockBareExecutionEnvironment({}, manifestObj);
      const { makeRedirectUri } = require('../AuthSession');
      expect(() => makeRedirectUri()).toThrowError(/Linking requires a build-time /);
    });
    it(`uses native value`, () => {
      mockBareExecutionEnvironment({}, manifestObj);
      const { makeRedirectUri } = require('../AuthSession');
      // Test that the path is omitted
      expect(makeRedirectUri({ path: 'bacon', native: 'value:/somn' })).toBe('value:/somn');
    });
  });
});

describe('Managed', () => {
  describe('Standalone', () => {
    describeManifestTypes(
      {
        scheme: 'demo',
        hostUri: 'exp.host/@test/test',
      },
      {
        extra: {
          expoClient: {
            scheme: 'demo',
            hostUri: 'exp.host/@test/test',
          } as ExpoClientConfig,
        },
      }
    )((_type, manifestObj) => {
      it(`creates a redirect URL`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: AppOwnership.Standalone,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(makeRedirectUri()).toBe('demo://');
      });
    });

    describeManifestTypes(
      {
        scheme: 'demo',
      },
      {
        extra: {
          expoClient: {
            scheme: 'demo',
          } as ExpoClientConfig,
        },
      }
    )((_type, manifestObj) => {
      it(`creates a redirect URL with a custom path`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: AppOwnership.Standalone,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(makeRedirectUri({ path: 'bacon' })).toBe('demo://bacon');
      });
    });

    describeManifestTypes(
      {
        scheme: 'demo',
      },
      {
        extra: {
          expoClient: {
            scheme: 'demo',
          } as ExpoClientConfig,
        },
      }
    )((_type, manifestObj) => {
      it(`uses native instead of generating a value`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: AppOwnership.Standalone,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(
          makeRedirectUri({
            native: 'native.thing://somn',
          })
        ).toBe('native.thing://somn');
      });
    });

    describe('Production', () => {
      describeManifestTypes(
        {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        {
          extra: {
            expoClient: {
              scheme: 'demo',
              hostUri: 'exp.host/@test/test',
            } as ExpoClientConfig,
          },
        }
      )((_type, manifestObj) => {
        it(`creates a redirect URL`, () => {
          mockConstants(
            {
              linkingUri: 'exp://exp.host/@test/test',
              appOwnership: AppOwnership.Expo,
              executionEnvironment: ExecutionEnvironment.StoreClient,
            },
            manifestObj
          );
          const { makeRedirectUri } = require('../AuthSession');

          expect(makeRedirectUri()).toBe('exp://exp.host/@test/test');
        });
      });

      describeManifestTypes(
        {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        {
          extra: {
            expoClient: {
              scheme: 'demo',
              hostUri: 'exp.host/@test/test',
            } as ExpoClientConfig,
          },
        }
      )((_type, manifestObj) => {
        it(`creates a redirect URL with a custom path`, () => {
          mockConstants(
            {
              linkingUri: 'exp://exp.host/@test/test',
              appOwnership: AppOwnership.Expo,
              executionEnvironment: ExecutionEnvironment.StoreClient,
            },
            manifestObj
          );

          const { makeRedirectUri } = require('../AuthSession');

          expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://exp.host/@test/test/--/bacon');
        });
      });
    });

    describe('Development', () => {
      describeManifestTypes(
        {
          scheme: 'demo',
          hostUri: '192.168.1.4:19000',
          developer: {
            projectRoot: '/Users/person/myapp',
            tool: 'expo-cli',
          },
        },
        {
          extra: {
            expoClient: {
              scheme: 'demo',
              hostUri: '192.168.1.4:19000',
            } as ExpoClientConfig,
            expoGo: {
              developer: {
                projectRoot: '/Users/person/myapp',
                tool: 'expo-cli',
              },
            },
          },
        }
      )((_type, manifestObj) => {
        const devConstants = {
          linkingUri: 'exp://192.168.1.4:19000/',
          experienceUrl: 'exp://192.168.1.4:19000',
          appOwnership: AppOwnership.Expo,
          executionEnvironment: ExecutionEnvironment.StoreClient,
        };

        it(`creates a redirect URL`, () => {
          mockConstants(devConstants, manifestObj);
          const { makeRedirectUri } = require('../AuthSession');
          expect(makeRedirectUri()).toBe('exp://192.168.1.4:19000');
        });
        it(`prefers localhost`, () => {
          mockConstants(devConstants, manifestObj);
          const { makeRedirectUri } = require('../AuthSession');
          expect(makeRedirectUri({ preferLocalhost: true })).toBe('exp://localhost:19000');
        });
        it(`creates a redirect URL with a custom path`, () => {
          mockConstants(devConstants, manifestObj);
          const { makeRedirectUri } = require('../AuthSession');
          expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://192.168.1.4:19000/--/bacon');
        });
      });
    });

    describe('Proxy', () => {
      describeManifestTypes(
        {
          id: 'fake',
          originalFullName: '@test/originaltest',
        },
        {
          extra: {
            expoClient: {
              originalFullName: '@test/originaltest',
            } as ExpoClientConfig,
          },
        }
      )((_type, manifestObj) => {
        it(`creates a redirect URL with useProxy`, () => {
          mockConstants({}, manifestObj);

          const { makeRedirectUri } = require('../AuthSession');

          // Should create a proxy URL and omit the extra path component
          expect(makeRedirectUri({ path: 'bacon', useProxy: true })).toBe(
            'https://auth.expo.io/@test/originaltest'
          );
        });
      });
    });
  });
});
