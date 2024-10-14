import axios from "../api/axios";

export const apiDevGet = () => axios({
  url: `/device`,
  method: "GET"
})
export const apiDevGetOne = id => axios({
  url: `/device/${id}`,
  method: "POST"
})
export const apiDevAdd = data => axios({
  url: `/device`,
  method: "POST",
  data
})
export const apiDevUpdate = data => axios({
  url: `/device`,
  method: "PUT",
  data
})
export const apiDevRemove = id => axios({
  url: `/device/${id}`,
  method: "DELETE"
})

export const apiDevInfo = data => axios({
  url: `/device/info`,
  method: "POST",
  useErrMsg: false,
  data
})
export const apiDevCmd = data => axios({
  url: `/device/cmd`,
  method: "POST",
  data
})