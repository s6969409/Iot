import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { apiDevGet } from "@/api/api"
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, message, Row, Space, Switch } from "antd";
import { apiDevCmd, apiDevInfo } from "../api/api";
import { sleep } from "../utils";

export default function () {
  const [devs, setDevs] = useState([])
  const [serverState, setServerState] = useState("Main")
  var backFuncIsRun = true;
  const gridStyle = {
    width: '100%',
    textAlign: 'center', border: '1px solid blue', padding: 8
  }

  const initDev = async ()=>{
    await apiDevGet().then(async e=>{
      await apiDevInfo(e.data.data).then(e=>{
        setDevs(e.data.data)
        setServerState("Main")
      }).catch(async eDevInfo=>{
        console.log('err',eDevInfo)
        await sleep(1000)
        setDevs(eDevInfo.response.data.err)
        setServerState("Main")
      })
    }).catch(async e=>{
      console.log('e-Server',e)
      // message.error({
      //   type: 'error',
      //   content: 'Server Error!'
      // })
      setServerState("Server Error")
    })
    
  }
  const dataUpdateHandler = async () =>{
    while(backFuncIsRun){
      //await sleep(1000)
      await initDev()
    }
  }

  useEffect(()=>{ 
    initDev()
  }, [])

  const [loading, setLoading] = useState(false);

  const swChange = async (v,p,dev) => {
    const cmd={
      ...dev,
      cmds:{setPinValue:[{pin:p.pin,value:v}]}
    }
    setLoading(true)

    await apiDevCmd(cmd).then(e=>{
      const resultVal = e.data.data.cmds.setPinValue.find(rp=>rp.pin == p.pin).fb

      const newDev = [...devs]
      newDev.find(d=>d.ip == dev.ip).cmds.getPinValue.find(rp=>rp.pin == p.pin).fb = resultVal
      setDevs(newDev)
    }).catch(e=>console.error('SWerr',e))
    setLoading(false)
  }

  const reNewClick = async dev =>{
    const cmd = {
      ip: dev.ip,
      port: dev.port,
      cmds: {...dev.cmds,getLocalTime: null}
    }
    setLoading(true)
    await apiDevCmd(cmd).then(e => {
      let newDevs = [...devs]
      const result = e.data.data
      newDevs.filter(d => d.ip == result.ip)[0].cmds = result.cmds
      
      setDevs(newDevs)
    }).catch(err=>console.log('dev-Err',err))
    setLoading(false)
  }
  return (
    <>
      <h2>{serverState}</h2>
      {devs.map(dev=>
        <Card key={dev.ip} title={
          <>
            <Col>{dev.desc}</Col>
            <Col>{dev.cmds.getLocalTime == undefined?dev.error:dev.cmds.getLocalTime.fb}</Col>
          </>
        } style={{ width: 300, padding: 0 }}
          actions={[
            <SettingOutlined key="setting" onClick={()=>reNewClick(dev)}/>
          ]}>
          {dev.cmds.getPinValue.map(p =>
            <Card.Grid key={p.pin} style={gridStyle}>
              <Row justify='space-between'>
                <Col>{p.comment}</Col>
                <Col>
                  {p.fb==undefined?"":<Switch checked={!!(p.Inv^p.fb)} loading={loading} onChange={v=>swChange(!!(v^p.Inv), p, dev)} />}
                </Col>
              </Row>
            </Card.Grid>
          )}
        </Card>
      )}
      <Link to="/">Main</Link>
    </>
  );
}