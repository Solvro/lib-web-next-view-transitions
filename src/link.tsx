import type { LinkProps } from "next/link";
import NextLink from "next/link";
import { useCallback } from "react";
import { useTransitionRouter } from "./use-transition-router";

/**
 * This is a wrapper around next/link that explicitly uses the router APIs
 * to navigate, and trigger a view transition.
 */
export function Link<T>(props: LinkProps<T>) {
  const router = useTransitionRouter();

  const { href, as, replace, scroll } = props;
  const onNavigate = useCallback(
    ({ preventDefault }: { preventDefault: () => void }) => {
      // adapted from https://github.com/vercel/next.js/blob/4f3980953800258d654ece9a239734e77950fce6/packages/next/src/client/link.tsx#L242-L254
      if (props.onNavigate) {
        let isDefaultPrevented = false;

        props.onNavigate({
          preventDefault: () => {
            isDefaultPrevented = true;
            preventDefault();
          },
        });

        if (isDefaultPrevented) {
          return;
        }
      }

      if (!("startViewTransition" in document)) {
        return;
      }
      preventDefault();

      const navigate = replace ? router.replace : router.push;
      navigate(as || href, { scroll: scroll ?? true });
    },
    [props.onNavigate, href, as, replace, scroll],
  );

  return <NextLink {...props} onNavigate={onNavigate} />;
}
