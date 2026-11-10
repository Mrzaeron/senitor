# Senitor learning prototype

This project generates a synthetic DSA learning dataset, trains baseline
classifiers, and provides an interpretable topic/problem recommendation
baseline. It does not read or write Supabase data.

All generated students, interactions, and evaluation results are synthetic.
Metrics are proof-of-concept only and must not be interpreted as validated
real-world student performance.

## Setup and train

From this directory, install `requirements.txt` in a Python environment, then
set the source directory on `PYTHONPATH` before running:

```powershell
python -m pip install -r requirements.txt
$env:PYTHONPATH = ".\src"
python -m senitor_ml.train --output-dir artifacts
```

The fixed random seed makes dataset generation, group splits, and model
training reproducible for a fixed dependency set. Training writes the dataset,
best fitted model, portable inference JSON, metrics, and plots to `artifacts/`.
It also refreshes `models/success_model.json`, the JSON inference bundle used
by the authenticated Senitor demo endpoint.

The target is whether a student solves a particular DSA problem successfully.
Features describe only prior performance/activity and the current problem's
difficulty. Student identifiers are used only to split the data; they are
never model inputs. Entire students are held out from training, validation,
and test sets. Models are selected on validation F1; the held-out test set is
used for the final model comparison.

## Run tests

```powershell
$env:PYTHONPATH = ".\src"
python -m unittest discover -s tests -v
```

## Recommendation baseline

`senitor_ml.recommendations` estimates topic mastery from a student's recent
attempts, unlocks topics based on prerequisite mastery, and selects suitable
problems with a human-readable reason. It is an interpretable baseline, not a
learned recommendation model. The classification model estimates problem
success independently and can be used to compare against this baseline when
real, consented learning data is available.
