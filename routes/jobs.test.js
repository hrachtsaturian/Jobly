/* eslint-disable no-unused-vars */
"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  userAdminToken,
} = require("./_testCommon");
const { user } = require("pg/lib/defaults");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "j10",
    salary: 1000,
    equity: 0,
    companyHandle: "c1",
  };

  test("works for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number), // resp.body.job.id
        title: "j10",
        salary: 1000,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 23,
        equity: 0.7,
      })
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("works for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 10,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 20,
          equity: "0.5",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "j3",
          salary: 30,
          equity: "0.9",
          companyHandle: "c3",
        },
      ],
    });
  });

  test("success: filters", async function () {
    const resp = await request(app).get(
      "/jobs?title=j2&minSalary=20&hasEquity=true"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j2",
          salary: 20,
          equity: "0.5",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("ignores invalid filters", async function () {
    const resp = await request(app).get(
      "/jobs?title=j1&minSalary=asd&hasEquity=equity"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 10,
          equity: "0",
          companyHandle: "c1",
        },
      ],
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: "j1",
        salary: 10,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/123123123`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: "j1-new",
        salary: 10,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app).patch(`/jobs/${jobId}`).send({
      title: "j1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/123123123`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.body).toEqual({ deleted: jobId.toString() });
  });

  test("unauth for anon", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app).delete(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/123123123`)
      .set("authorization", `Bearer ${userAdminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
