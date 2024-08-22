"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
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
  const newJob = {
    title: "newTitle",
    salary: 0,
    equity: 0.1,
    companyHandle: "c1",
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "newTitle",
      salary: 0,
      equity: "0.1",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id=${job.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "newTitle",
        salary: 0,
        equity: "0.1",
        companyHandle: "c1",
      },
    ]);
  });

  test("should throw bad request error when title is a dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("should throw not found error when no company is found for the given company_handle", async function () {
    try {
      await Job.create({
        title: "newTitle",
        salary: 0,
        equity: 0.1,
        companyHandle: "c4",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
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
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30,
        equity: "0.9",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: title filter", async function () {
    const jobs = await Job.findAll({ title: "j1" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: minSalary filter", async function () {
    const jobs = await Job.findAll({ minSalary: 20 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20,
        equity: "0.5",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30,
        equity: "0.9",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: hasEquity - true filter", async function () {
    const jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20,
        equity: "0.5",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30,
        equity: "0.9",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: hasEquity - false filter", async function () {
    const jobs = await Job.findAll({ hasEquity: false });
    expect(jobs).toEqual([
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
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 30,
        equity: "0.9",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: all filters", async function () {
    const jobs = await Job.findAll({
      title: "j2",
      minSalary: 20,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20,
        equity: "0.5",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const jobs = await Job.findAll();
    const job = await Job.get(jobs[0].id);
    expect(job).toEqual({
      id: jobs[0].id,
      title: "j1",
      salary: 10,
      equity: "0",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(123123123);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "updated title",
    salary: 42,
    equity: 0.99,
  };

  test("works", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id;
    const job = await Job.update(jobId, updateData);
    expect(job).toEqual({
      id: jobId,
      title: "updated title",
      salary: 42,
      equity: "0.99",
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${jobId}`
    );
    expect(result.rows).toEqual([
      {
        id: jobId,
        title: "updated title",
        salary: 42,
        equity: "0.99",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: partial update", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id
    const updateDataSetNulls = {
      title: "updated title",
    };

    const job = await Job.update(jobId, updateDataSetNulls);
    expect(job).toEqual({
      id: jobId,
      title: "updated title",
      salary: 10,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${jobId}`
    );
    expect(result.rows).toEqual([
      {
        id: jobId,
        title: "updated title",
        salary: 10,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(123123123, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(123123123, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobs = await Job.findAll();
    const jobId = jobs[0].id
    await Job.remove(jobId);
    const res = await db.query(`SELECT title FROM jobs WHERE id=${jobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(123123123);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
