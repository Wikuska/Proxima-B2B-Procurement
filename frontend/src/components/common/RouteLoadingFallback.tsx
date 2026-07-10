import ErrorState from "./ErrorState";

export default function RouteLoadingFallback() {
  return <ErrorState type="loading" message="Loading your account..." />;
}
