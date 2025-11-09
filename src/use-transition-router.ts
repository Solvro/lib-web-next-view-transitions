import { useRouter as useNextRouter } from "next/navigation";
import { startTransition, useCallback, useMemo } from "react";
import { useSetFinishViewTransition } from "./transition-context";
import {
  AppRouterInstance,
  NavigateOptions,
} from "next/dist/shared/lib/app-router-context.shared-runtime";

export type TransitionOptions = {
  /**
   * Callback invoked before the transition starts, but after the "before" DOM snapshot has been taken.
   * Can be asynchronous. Aborts the view transition if it throws or rejects.
   * Called before navigation if the browser doesn't support view transitions.
   * @since v0.4.1
   */
  onSnapshotTaken?: () => void | Promise<void>;
  onTransitionReady?: () => void;
};

type NavigateOptionsWithTransition = NavigateOptions & TransitionOptions;

export type TransitionRouter = AppRouterInstance & {
  push: (href: string, options?: NavigateOptionsWithTransition) => void;
  replace: (href: string, options?: NavigateOptionsWithTransition) => void;
};

export function useTransitionRouter() {
  const router = useNextRouter();
  const finishViewTransition = useSetFinishViewTransition();

  const triggerTransition = useCallback(
    async (
      cb: () => void,
      { onSnapshotTaken, onTransitionReady }: TransitionOptions = {},
    ) => {
      if ("startViewTransition" in document) {
        // @ts-ignore
        const transition = document.startViewTransition(async () => {
          await onSnapshotTaken?.();
          return new Promise<void>((resolve) => {
            startTransition(() => {
              cb();
              finishViewTransition(() => resolve);
            });
          });
        });

        if (onTransitionReady) {
          transition.ready.then(onTransitionReady);
        }
      } else {
        await onSnapshotTaken?.();
        return cb();
      }
    },
    [],
  );

  const push = useCallback(
    (
      href: string,
      {
        onSnapshotTaken,
        onTransitionReady,
        ...options
      }: NavigateOptionsWithTransition = {},
    ) => {
      triggerTransition(() => router.push(href, options), {
        onSnapshotTaken,
        onTransitionReady,
      });
    },
    [triggerTransition, router],
  );

  const replace = useCallback(
    (
      href: string,
      {
        onSnapshotTaken,
        onTransitionReady,
        ...options
      }: NavigateOptionsWithTransition = {},
    ) => {
      triggerTransition(() => router.replace(href, options), {
        onSnapshotTaken,
        onTransitionReady,
      });
    },
    [triggerTransition, router],
  );

  return useMemo<TransitionRouter>(
    () => ({
      ...router,
      push,
      replace,
    }),
    [push, replace, router],
  );
}
