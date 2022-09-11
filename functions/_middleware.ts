import "./console.js"


export const onRequest = async ({ next }) => {


console.info(1)
	
	const response = await next();
	response.headers.set("x-custom", "header value");
	return response;
};
