import {Ratelimit} from "@upstash/ratelimit"
import redis from "./redis"

const ratelimit=new Ratelimit({
    redis:redis,
    limiter:Ratelimit.slidingWindow(10,'15s'),
    prefix:"@rate-limit-13#",
    analytics:true
})

export default ratelimit