import base64
import io
import os
import tempfile

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import gradio as gr

from transformers import pipeline
from PIL import Image

from pypdf import PdfReader
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MODELS
# Lazy loaded
# =========================================================

classifier = None
summarizer = None
chat_model = None


def get_classifier():
    global classifier

    if classifier is None:
        print("Loading skin disease classifier...")

        classifier = pipeline(
            "image-classification",
            model="Jayanth2002/dinov2-base-finetuned-SkinDisease",
            device=-1
        )

        print("Skin disease classifier loaded.")

    return classifier


def get_summarizer():
    global summarizer

    if summarizer is None:
        print("Loading summarizer...")

        summarizer = pipeline(
            "summarization",
            model="sshleifer/distilbart-cnn-12-6",
            device=-1
        )

        print("Summarizer loaded.")

    return summarizer


def get_chat_model():
    global chat_model

    if chat_model is None:
        print("Loading chat model...")

        chat_model = pipeline(
            "text-generation",
            model="Qwen/Qwen2.5-1.5B-Instruct",
            device=-1
        )

        print("Chat model loaded.")

    return chat_model


# =========================================================
# COMMON SUMMARY FUNCTION
# =========================================================

def generate_summary(text):

    if not text or not text.strip():
        raise ValueError("No medical report text provided.")

    text = text[:3500]

    banned = [
        "http",
        "www",
        ".com",
        "visit the website"
    ]

    clean_text = " ".join(
        line
        for line in text.split("\n")
        if not any(
            b in line.lower()
            for b in banned
        )
    )

    if not clean_text.strip():
        raise ValueError("No usable report text found.")

    model = get_summarizer()

    result = model(
        clean_text,
        max_length=180,
        min_length=60,
        do_sample=False
    )

    summary = result[0]["summary_text"]

    lower = clean_text.lower()

    risk = "Low"

    if any(
        x in lower
        for x in ["cancer", "tumor", "critical"]
    ):
        risk = "High"

    elif any(
        x in lower
        for x in ["infection", "pain", "abnormal"]
    ):
        risk = "Moderate"

    return summary, risk


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def extract_pdf_text(pdf_path):

    if not pdf_path:
        raise ValueError("Please upload a PDF.")

    reader = PdfReader(pdf_path)

    extracted_text = []

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            extracted_text.append(page_text)

    text = "\n".join(extracted_text).strip()

    if not text:
        raise ValueError(
            "Could not extract text from this PDF. "
            "The PDF may be scanned/image-based."
        )

    return text


# =========================================================
# PDF GENERATION
# =========================================================

def create_summary_pdf(summary, risk):

    output_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    )

    output_path = output_file.name
    output_file.close()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    title_style = styles["Title"]
    title_style.alignment = TA_CENTER

    heading_style = styles["Heading2"]
    body_style = styles["BodyText"]

    elements = []

    elements.append(
        Paragraph(
            "MediSense AI - Medical Report Summary",
            title_style
        )
    )

    elements.append(Spacer(1, 20))

    elements.append(
        Paragraph(
            f"<b>Risk Level:</b> {risk}",
            heading_style
        )
    )

    elements.append(Spacer(1, 15))

    elements.append(
        Paragraph(
            "<b>AI Generated Summary</b>",
            heading_style
        )
    )

    elements.append(Spacer(1, 10))

    # Escape basic HTML-sensitive characters
    safe_summary = (
        summary
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

    elements.append(
        Paragraph(
            safe_summary,
            body_style
        )
    )

    elements.append(Spacer(1, 30))

    elements.append(
        Paragraph(
            "This summary is generated by an AI system "
            "and should not replace professional medical judgment.",
            body_style
        )
    )

    doc.build(elements)

    return output_path


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "status": "running",
        "application": "MediSense AI"
    }


# =========================================================
# PREDICT API
# =========================================================

@app.post("/predict")
async def predict(request: Request):

    try:

        data = await request.json()

        image_b64 = data.get("image")

        if not image_b64:
            return JSONResponse(
                content={"error": "No image provided"},
                status_code=400
            )

        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_b64)

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        model = get_classifier()

        results = model(image)

        top = results[0]

        return {
            "disease": top["label"],
            "confidence": round(
                top["score"] * 100,
                2
            )
        }

    except Exception as e:

        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )


# =========================================================
# PDF SUMMARY API
# =========================================================

@app.post("/pdf-summary")
async def pdf_summary(request: Request):

    try:

        data = await request.json()

        text = data.get("text", "")

        summary, risk = generate_summary(text)

        return {
            "summary": summary,
            "riskLevel": risk
        }

    except Exception as e:

        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )


# =========================================================
# CHAT API
# =========================================================

@app.post("/chat")
async def chat(request: Request):

    try:

        data = await request.json()

        messages = data.get("messages", [])

        if not messages:
            return JSONResponse(
                content={"error": "No messages provided"},
                status_code=400
            )

        last_user_msg = messages[-1].get(
            "content",
            ""
        )

        if not last_user_msg:
            return JSONResponse(
                content={"error": "Empty message"},
                status_code=400
            )

        model = get_chat_model()

        chat_messages = [
            {
                "role": "system",
                "content": (
                    "You are a clinical reference assistant "
                    "for doctors. Answer in 2-3 sentences, "
                    "direct and concise. Do not claim certainty "
                    "about diagnosis or treatment."
                )
            },
            {
                "role": "user",
                "content": last_user_msg
            }
        ]

        result = model(
            chat_messages,
            max_new_tokens=120,
            do_sample=False
        )

        generated = result[0]["generated_text"]

        if isinstance(generated, list):
            reply = generated[-1]["content"]
        else:
            reply = str(generated)

        return {
            "reply": reply
        }

    except Exception as e:

        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )


# =========================================================
# GRADIO - SKIN PREDICTION
# =========================================================

def gradio_predict(image):

    if image is None:
        return "Please upload an image.", ""

    try:

        model = get_classifier()

        results = model(image)

        top = results[0]

        disease = top["label"]

        confidence = round(
            top["score"] * 100,
            2
        )

        return disease, f"{confidence}%"

    except Exception as e:

        return f"Error: {str(e)}", ""


# =========================================================
# GRADIO - TEXT SUMMARY
# =========================================================

def gradio_summary(text):

    if not text:
        return "Please enter report text.", ""

    try:

        summary, risk = generate_summary(text)

        return summary, risk

    except Exception as e:

        return f"Error: {str(e)}", ""


# =========================================================
# GRADIO - PDF SUMMARY
# =========================================================

def gradio_pdf_summary(pdf_file):

    if pdf_file is None:
        return None, "Please upload a PDF.", ""

    try:

        # Gradio can provide a filepath
        pdf_path = (
            pdf_file
            if isinstance(pdf_file, str)
            else pdf_file.name
        )

        text = extract_pdf_text(pdf_path)

        summary, risk = generate_summary(text)

        output_pdf = create_summary_pdf(
            summary,
            risk
        )

        return (
            output_pdf,
            summary,
            risk
        )

    except Exception as e:

        return (
            None,
            f"Error: {str(e)}",
            ""
        )


# =========================================================
# GRADIO - CHAT
# =========================================================

def gradio_chat(message):

    if not message:
        return "Please enter a message."

    try:

        model = get_chat_model()

        chat_messages = [
            {
                "role": "system",
                "content": (
                    "You are a clinical reference assistant "
                    "for doctors. Answer in 2-3 sentences, "
                    "direct and concise. Do not claim certainty "
                    "about diagnosis or treatment."
                )
            },
            {
                "role": "user",
                "content": message
            }
        ]

        result = model(
            chat_messages,
            max_new_tokens=120,
            do_sample=False
        )

        generated = result[0]["generated_text"]

        if isinstance(generated, list):
            reply = generated[-1]["content"]
        else:
            reply = str(generated)

        return reply

    except Exception as e:

        return f"Error: {str(e)}"


# =========================================================
# GRADIO UI
# =========================================================

with gr.Blocks(
    title="MediSense AI"
) as demo:

    gr.Markdown(
        """
        # 🩺 MediSense AI

        AI-powered clinical assistance for:

        - Skin disease detection
        - Medical report summarization
        - Clinical reference chat

        **For clinical reference only. AI output should not
        replace professional medical judgment.**
        """
    )

    # =====================================================
    # SKIN DISEASE
    # =====================================================

    with gr.Tab("Skin Disease Detection"):

        image_input = gr.Image(
            type="pil",
            label="Upload Skin Image"
        )

        predict_button = gr.Button(
            "Analyze Image"
        )

        disease_output = gr.Textbox(
            label="Predicted Disease"
        )

        confidence_output = gr.Textbox(
            label="Confidence"
        )

        predict_button.click(
            fn=gradio_predict,
            inputs=image_input,
            outputs=[
                disease_output,
                confidence_output
            ]
        )

    # =====================================================
    # PDF SUMMARY
    # =====================================================

    with gr.Tab("Medical Report Summary"):

        gr.Markdown(
            "### Upload a medical report PDF"
        )

        pdf_input = gr.File(
            label="Upload Medical Report",
            file_types=[".pdf"],
            type="filepath"
        )

        pdf_button = gr.Button(
            "Generate PDF Summary"
        )

        pdf_output = gr.File(
            label="Download Summary PDF"
        )

        pdf_summary_output = gr.Textbox(
            label="AI Summary",
            lines=8
        )

        pdf_risk_output = gr.Textbox(
            label="Risk Level"
        )

        pdf_button.click(
            fn=gradio_pdf_summary,
            inputs=pdf_input,
            outputs=[
                pdf_output,
                pdf_summary_output,
                pdf_risk_output
            ]
        )

        gr.Markdown("---")

        gr.Markdown(
            "### Or paste report text"
        )

        report_input = gr.Textbox(
            label="Medical Report Text",
            lines=15,
            placeholder="Paste medical report text here..."
        )

        summary_button = gr.Button(
            "Generate Summary"
        )

        summary_output = gr.Textbox(
            label="Summary",
            lines=8
        )

        risk_output = gr.Textbox(
            label="Risk Level"
        )

        summary_button.click(
            fn=gradio_summary,
            inputs=report_input,
            outputs=[
                summary_output,
                risk_output
            ]
        )

    # =====================================================
    # CHAT
    # =====================================================

    with gr.Tab("Clinical Assistant"):

        chat_input = gr.Textbox(
            label="Ask a clinical question",
            placeholder="Enter your question..."
        )

        chat_button = gr.Button(
            "Ask MediSense"
        )

        chat_output = gr.Textbox(
            label="AI Response",
            lines=8
        )

        chat_button.click(
            fn=gradio_chat,
            inputs=chat_input,
            outputs=chat_output
        )


# =========================================================
# MOUNT GRADIO
# =========================================================

app = gr.mount_gradio_app(
    app,
    demo,
    path="/gradio"
)


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    import os
    import uvicorn

    port = int(os.environ.get("PORT", 7860))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )