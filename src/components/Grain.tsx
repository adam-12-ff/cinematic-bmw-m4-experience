/** Full-page film grain + soft vignette. Pure CSS, GPU friendly. */
export default function Grain() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
