import assert from 'assert'
import {expect,use,should} from 'chai'
import chaiHttp from "chai-http" 

const client = use(chaiHttp)

describe("Test Posts and Comments",()=>{
    it("Get /posts",()=>{
        client.request("http://localhost:3000")
        .get("/posts")
        .end((err,res)=>{
            //console.log(res)
            expect(err).to.be.null
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(2)
        })      
    })
    it("Get /posts/1",()=>{
        client.request("http://localhost:3000")
        .get("/posts/1")
        .end((err,res)=>{
            console.log(res.body)
            expect(err).to.be.null
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body["id"]).to.equal("1")
        })      
    })
    it("Get /posts?_embed=comments",()=>{
        client.request("http://localhost:3000")
        .get("/posts?_embed=comments")
        .end((err,res)=>{
            //console.log(res.body)
            expect(err).to.be.null
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            res.body.forEach(post => {
                expect(post).to.have.a.property('comments')
                if(post["id"]==="1"){
                    expect(post['comments']).to.have.lengthOf(2)
                }
                else if(post["id"]==="2"){
                    expect(post['comments']).to.have.lengthOf(0)
                }
            });
        })      
    })    

})