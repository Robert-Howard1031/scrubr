export type MediaFilter = 'photos' | 'videos' | 'screenshots';

export type RootStackParamList = {
  Permission: undefined;
  Home: undefined;
  Swipe: { filter: MediaFilter };
  Settings: undefined;
  Privacy: undefined;
};
