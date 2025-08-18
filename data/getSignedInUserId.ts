import { createServerFn } from "@tanstack/react-start";
import { getAuth } from "@clerk/tanstack-react-start/server";
import { getWebRequest } from "@tanstack/react-start/server";

export const getSignedInUserId = createServerFn({
	method: "GET",
}).handler(async () => {
	const request = getWebRequest();
	const user = await getAuth(request);
	return user?.userId ?? null;
});
