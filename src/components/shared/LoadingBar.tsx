/** Indeterminate loading bar — shown while a request is in flight and the UI must wait for it to settle. */
export function LoadingBar() {
  return (
    <div className="lumeo:h-0.5 lumeo:w-full lumeo:overflow-hidden lumeo:rounded-full lumeo:bg-zinc-100">
      <div className="lumeo:h-full lumeo:w-1/3 lumeo:animate-loading-bar lumeo:rounded-full lumeo:bg-zinc-900" />
    </div>
  );
}
