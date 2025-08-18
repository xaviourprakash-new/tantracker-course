import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
	beforeLoad({ context }) {
		if (!context.userId) {
			redirect({
				to: "/",
				throw: true,
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			{/* To render the actual content from the component.
			Else it will render the content from the authed.tsx */}
			<Outlet />
		</div>
	);
}
