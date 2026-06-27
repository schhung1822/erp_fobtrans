"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import { type StoreApi, useStore } from "zustand";

import { type FontKey, fontRegistry } from "@/lib/fonts/registry";
import {
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
} from "@/lib/preferences/layout";
import {
  applyContentLayout,
  applyFont,
  applyNavbarStyle,
  applySidebarCollapsible,
  applySidebarVariant,
} from "@/lib/preferences/layout-utils";
import {
  PREFERENCE_DEFAULTS,
  PREFERENCE_PERSISTENCE,
  type PreferenceKey,
  type PreferenceValueMap,
} from "@/lib/preferences/preferences-config";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from "@/lib/preferences/theme";
import { applyThemeMode, applyThemePreset, subscribeToSystemTheme } from "@/lib/preferences/theme-utils";

import { createPreferencesStore, type PreferencesState } from "./preferences-store";

const PreferencesStoreContext = createContext<StoreApi<PreferencesState> | null>(null);

const FONT_VALUES = Object.keys(fontRegistry) as FontKey[];

function getSafeValue<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function readCookie(name: string) {
  const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function readLocal(name: string) {
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function readPreference<K extends PreferenceKey>(key: K): PreferenceValueMap[K] {
  const mode = PREFERENCE_PERSISTENCE[key];
  let value: string | null = null;

  if (mode === "localStorage") value = readLocal(key);

  if (!value && (mode === "client-cookie" || mode === "server-cookie")) {
    value = readCookie(key);
  }

  return (value ?? PREFERENCE_DEFAULTS[key]) as PreferenceValueMap[K];
}

function readDomState(): Partial<PreferencesState> {
  const root = document.documentElement;

  const themeModeAttr = getSafeValue(root.getAttribute("data-theme-mode"), THEME_MODE_VALUES);
  const resolvedMode = root.classList.contains("dark") ? "dark" : "light";

  return {
    themeMode: themeModeAttr ?? resolvedMode,
    resolvedThemeMode: resolvedMode,
    themePreset: getSafeValue(root.getAttribute("data-theme-preset"), THEME_PRESET_VALUES),
    font: getSafeValue(root.getAttribute("data-font"), FONT_VALUES),
    contentLayout: getSafeValue(root.getAttribute("data-content-layout"), CONTENT_LAYOUT_VALUES),
    navbarStyle: getSafeValue(root.getAttribute("data-navbar-style"), NAVBAR_STYLE_VALUES),
    sidebarVariant: getSafeValue(root.getAttribute("data-sidebar-variant"), SIDEBAR_VARIANT_VALUES),
    sidebarCollapsible: getSafeValue(root.getAttribute("data-sidebar-collapsible"), SIDEBAR_COLLAPSIBLE_VALUES),
  };
}

function readPersistedState(): Partial<PreferencesState> {
  const themeMode = getSafeValue(readPreference("theme_mode"), THEME_MODE_VALUES) ?? PREFERENCE_DEFAULTS.theme_mode;

  return {
    themeMode,
    themePreset: getSafeValue(readPreference("theme_preset"), THEME_PRESET_VALUES) ?? PREFERENCE_DEFAULTS.theme_preset,
    font: getSafeValue(readPreference("font"), FONT_VALUES) ?? PREFERENCE_DEFAULTS.font,
    contentLayout:
      getSafeValue(readPreference("content_layout"), CONTENT_LAYOUT_VALUES) ?? PREFERENCE_DEFAULTS.content_layout,
    navbarStyle: getSafeValue(readPreference("navbar_style"), NAVBAR_STYLE_VALUES) ?? PREFERENCE_DEFAULTS.navbar_style,
    sidebarVariant:
      getSafeValue(readPreference("sidebar_variant"), SIDEBAR_VARIANT_VALUES) ?? PREFERENCE_DEFAULTS.sidebar_variant,
    sidebarCollapsible:
      getSafeValue(readPreference("sidebar_collapsible"), SIDEBAR_COLLAPSIBLE_VALUES) ??
      PREFERENCE_DEFAULTS.sidebar_collapsible,
  };
}

function applyPreferenceAttributes(state: Partial<PreferencesState>) {
  if (state.themePreset) applyThemePreset(state.themePreset);
  if (state.font) applyFont(state.font);
  if (state.contentLayout) applyContentLayout(state.contentLayout);
  if (state.navbarStyle) applyNavbarStyle(state.navbarStyle);
  if (state.sidebarVariant) applySidebarVariant(state.sidebarVariant);
  if (state.sidebarCollapsible) applySidebarCollapsible(state.sidebarCollapsible);
}

export const PreferencesStoreProvider = ({
  children,
  themeMode,
  themePreset,
  font,
  contentLayout,
  navbarStyle,
}: {
  children: React.ReactNode;
  themeMode: PreferencesState["themeMode"];
  themePreset: PreferencesState["themePreset"];
  font: PreferencesState["font"];
  contentLayout: PreferencesState["contentLayout"];
  navbarStyle: PreferencesState["navbarStyle"];
}) => {
  const [store] = useState<StoreApi<PreferencesState>>(() =>
    createPreferencesStore({
      themeMode,
      themePreset,
      font,
      contentLayout,
      navbarStyle,
    }),
  );

  const domSnapshotRef = useRef<Partial<PreferencesState> | null>(null);

  useEffect(() => {
    const domState = readDomState();
    const persistedState = readPersistedState();
    const nextState = {
      ...domState,
      ...persistedState,
    };

    domSnapshotRef.current = nextState;
    applyPreferenceAttributes(nextState);

    store.setState((prev) => ({
      ...prev,
      ...nextState,
      isSynced: true,
    }));
  }, [store]);

  useEffect(() => {
    let unsubscribeMedia: (() => void) | undefined;

    const applyFromMode = (mode: PreferencesState["themeMode"]) => {
      unsubscribeMedia?.();
      const resolved = applyThemeMode(mode);
      store.setState((prev) => ({ ...prev, resolvedThemeMode: resolved }));

      if (mode === "system") {
        unsubscribeMedia = subscribeToSystemTheme(() => {
          const next = applyThemeMode("system");
          store.setState((prev) => ({ ...prev, resolvedThemeMode: next }));
        });
      }
    };

    const startMode = domSnapshotRef.current?.themeMode ?? store.getState().themeMode;
    applyFromMode(startMode);

    const unsubscribeStore = store.subscribe((s, p) => {
      if (s.themeMode !== p.themeMode) applyFromMode(s.themeMode);
      if (s.themePreset !== p.themePreset) applyThemePreset(s.themePreset);
      if (s.font !== p.font) applyFont(s.font);
      if (s.contentLayout !== p.contentLayout) applyContentLayout(s.contentLayout);
      if (s.navbarStyle !== p.navbarStyle) applyNavbarStyle(s.navbarStyle);
      if (s.sidebarVariant !== p.sidebarVariant) applySidebarVariant(s.sidebarVariant);
      if (s.sidebarCollapsible !== p.sidebarCollapsible) applySidebarCollapsible(s.sidebarCollapsible);
    });

    return () => {
      unsubscribeMedia?.();
      unsubscribeStore();
    };
  }, [store]);

  return <PreferencesStoreContext.Provider value={store}>{children}</PreferencesStoreContext.Provider>;
};

export const usePreferencesStore = <T,>(selector: (state: PreferencesState) => T): T => {
  const store = useContext(PreferencesStoreContext);
  if (!store) throw new Error("Missing PreferencesStoreProvider");
  return useStore(store, selector);
};
