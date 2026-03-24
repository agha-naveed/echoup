import { createClient } from "redis"

const redis = createClient({
    socket: {
        host: "localhost",
        port: 6379
    },
    password: "mypassword"
}).on("error", (err) => {
    console.log("Redis Error: ", err)
}).connect()

export default redis;