import { createMiddleware } from "@tanstack/react-start";
import { getAuth } from "@clerk/tanstack-react-start/server";
import { getWebRequest } from "@tanstack/react-start/server";

const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }: any) => {
		const request = getWebRequest();
		const user = await getAuth(request);

		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		return next({
			context: {
				userId: user.userId,
			},
		});
	},
);

export default authMiddleware;
