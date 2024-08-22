"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Application = require("./application.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  test("works", async function () {
    const jobs = await Job.findAll();
    const username = "u1";
    const jobId = jobs[0].id;
    let application = await Application.create({ username, jobId });
    expect(application).toEqual({ username, jobId });

    const result = await db.query(
      `SELECT username, job_id AS "jobId" FROM applications WHERE username='${username}' AND job_id=${jobId}`
    );

    expect(result.rows[0]).toEqual({ username, jobId });
  });

  test("bad request with dupe", async function () {
    try {
      const jobs = await Job.findAll();
      const username = "u1";
      const jobId = jobs[0].id;
      await Application.create({ username, jobId });
      await Application.create({ username, jobId });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      const jobs = await Job.findAll();
      const jobId = jobs[0].id;
      await Application.create({ username: "nope", jobId });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such job", async function () {
    try {
      await Application.create({ username: "u1", jobId: 123123123 });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
