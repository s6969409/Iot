import { Button, Checkbox, Col, Form, Input, Modal, Row, Switch, Typography } from "antd";
import { apiDevCmd } from "../api/api";
import { useState } from "react";
import { validateNumber, validateRequire } from "./EditDev";
import TextArea from "antd/es/input/TextArea";

const FormListAdapter = ({ params }) => {
  const { fields, operation, errors, getDatas, label } = params
  const getValues = () => {
    const values = getDatas()?.join(',')
    return values == '' ? {value:'無資料', style:{border:'1px red solid'}} : {value: values}
  }
  return <>
    <Form.Item label={label} noStyle>
    </Form.Item>
    {fields.map((field, index) => (
      <Form.Item key={field.key} noStyle>
        <Row justify='space-between' wrap={false}>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'use']} valuePropName="checked" style={{marginBottom:0}}><Checkbox/></Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'comment']} rules={[validateRequire]} hasFeedback={true} style={{marginBottom:0}}><Input readOnly/></Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'value']} style={{marginBottom:0}}><Switch /></Form.Item>
          </Col>
        </Row>
      </Form.Item>
    ))}
  </>
}

export default function ({ dev, cmds, onChange }) {
  const cmdsDefault = {setPinValue:dev.cmds.getPinValue.map((p,i)=>{
    const {setPinValue} = JSON.parse(cmds??"{}")
    const setP = setPinValue.find(sp=>sp.pin==p.pin)
    return {...p,
      use:setPinValue != null && setPinValue.every(sp=>sp.pin==p.pin),
      value: setP != null && !!(setP.value^p.Inv)
    }
  })}
  const [form] = Form.useForm();
  const [useTeach, setUseTeach] = useState()
  const [useSetPinValue, setUseSetPinValue] = useState(cmdsDefault.setPinValue.some(p=>p.use))
  const [isEditCmds, setIsEditCmds] = useState();

  const onFinish = async (values) => {
    const cmds = {}
    if(useSetPinValue){
      const sp = values.setPinValue
      .filter(v=>v.use)
      .map(v=>{return{
        pin:v.pin,value:!!(v.value ^v.Inv)
      }})
      if(sp.length > 0)cmds.setPinValue = sp
    }
    if(useTeach)cmds.teach = null
    onChange(JSON.stringify(cmds))
    setIsEditCmds(false)
  }

  const onCancel = () => {
    setIsEditCmds(false)
  }
  
  const getDatas = () => {
    return form.getFieldValue('setPinValue')?.filter(c => c != undefined && c != '')
  }
  return (
    <>
      {isEditCmds ?
        <Modal title={`${dev.ip} CmdBuilder`} open={isEditCmds} cancelButtonProps={{ style: { display: 'none' } }} okButtonProps={{ style: { display: 'none' } }} closable={false}>
          <Row>
            <Col><Typography.Text>teach</Typography.Text></Col>
            <Col><Switch onChange={v => setUseTeach(v)} defaultChecked={cmdsDefault.teach != undefined}/></Col>
          </Row>
          <Row>
            <Col><Typography.Text>setPinValue</Typography.Text></Col>
            <Col><Switch onChange={v => setUseSetPinValue(v)} defaultChecked={useSetPinValue}/></Col>
          </Row>

          <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} layout="horizontal" onFinish={onFinish}>

            {useSetPinValue && <Form.Item >
              <Form.List name={['setPinValue']} initialValue={cmdsDefault.setPinValue}>
                {(fields, operation, errors) => <FormListAdapter params={{ fields, operation, errors, getDatas: getDatas }} />}
              </Form.List>
            </Form.Item>}

            <Form.Item wrapperCol>
              <Row justify='end'>
                <Col><Button style={{ marginRight: 20 }} onClick={onCancel}>取消</Button></Col>
                <Col><Button htmlType="submit">儲存</Button></Col>
              </Row>
            </Form.Item>
          </Form>
        </Modal>

        : <>
          <TextArea placeholder="cmd json" defaultValue={cmds} onChange={v=>onChange(v.target.value)}/>
          <Button onClick={() => setIsEditCmds(true)}>Guide</Button>
        </>
          }
    </>
  );
}