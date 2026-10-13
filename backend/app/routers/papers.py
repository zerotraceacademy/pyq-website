from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from app.repositories.data_store import data_store
from app.services.r2_service import r2_service

router = APIRouter(prefix="/papers", tags=["Question Papers"])

@router.get("")
async def get_papers(
    examId: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    paperType: Optional[str] = Query(None)
):
    papers = await data_store.list_papers(exam_id=examId, year=year, search=search, paper_type=paperType)
    return {"papers": papers}

@router.get("/{slug}")
async def get_paper_details(slug: str):
    paper = await data_store.get_paper_by_slug(slug)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")
    questions = await data_store.list_questions(paper_id=paper["id"])
    return {"paper": paper, "questions": questions}

@router.get("/{id}/download-url")
async def get_paper_download_url(id: str):
    """
    Generates authorized, short-lived signed R2 download URL.
    Increments download metrics and returns authenticated expiring resource locator.
    """
    paper = await data_store.get_paper_by_id(id)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

    # Increment download counter
    new_downloads = paper.get("downloadsCount", 0) + 1
    await data_store.update_paper(id, {"downloadsCount": new_downloads})

    desc = r2_service.create_download_descriptor(
        object_key=paper.get("r2ObjectKey", f"papers/{paper['slug']}.pdf"),
        filename=f"{paper['slug']}.pdf"
    )

    return {
        "downloadUrl": desc["downloadUrl"],
        "filename": desc["filename"],
        "expiresAt": desc["expiresAt"],
        "fileSizeBytes": paper.get("fileSizeBytes", 0)
    }
